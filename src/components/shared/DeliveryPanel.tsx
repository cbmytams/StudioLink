import { useEffect, useMemo, useState } from 'react';
import { FileAudio, FileArchive, FileText } from 'lucide-react';
import { useAuth } from '@/lib/supabase/auth';
import { supabase } from '@/lib/supabase/client';
import type { MissionFileRecord } from '@/types/backend';
import { deleteFile, getDeliveryFiles, getSignedUrl, uploadDeliveryFile } from '@/lib/files/fileService';
import { formatFileSize } from '@/lib/files/fileUtils';
import { FileUpload } from './FileUpload';
import { useToast } from '@/components/ui/Toast';
import { toUserFacingErrorMessage } from '@/lib/errors/userFacing';

type DeliveryPanelProps = {
  sessionId: string;
  missionId: string;
  canUpload: boolean;
  refreshKey?: string | number;
};

function fileIcon(file: MissionFileRecord) {
  if (file.mime_type?.startsWith('audio/')) {
    return <FileAudio className="h-4 w-4 text-orange-500" />;
  }
  if (file.mime_type === 'application/zip' || file.mime_type === 'application/x-zip-compressed') {
    return <FileArchive className="h-4 w-4 text-orange-500" />;
  }
  return <FileText className="h-4 w-4 text-orange-500" />;
}

export function DeliveryPanel({ sessionId, missionId, canUpload, refreshKey }: DeliveryPanelProps) {
  const { session } = useAuth();
  const { showToast } = useToast();

  const [files, setFiles] = useState<MissionFileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [audioUrls, setAudioUrls] = useState<Record<string, string>>({});
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);

  const currentUserId = session?.user?.id ?? null;

  useEffect(() => {
    let active = true;

    const loadFiles = async () => {
      setLoading(true);
      setError(null);

      try {
        const deliveryFiles = await getDeliveryFiles(sessionId);
        if (!active) return;
        setFiles(deliveryFiles);

        const nextAudioUrls: Record<string, string> = {};
        await Promise.all(
          deliveryFiles
            .filter((file) => file.mime_type?.startsWith('audio/'))
            .map(async (file) => {
              nextAudioUrls[file.id] = await getSignedUrl('delivery-files', file.file_url);
            }),
        );

        if (!active) return;
        setAudioUrls(nextAudioUrls);
      } catch (loadError) {
        if (!active) return;
        setError(toUserFacingErrorMessage(loadError, 'Impossible de charger les livraisons.'));
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadFiles();

    return () => {
      active = false;
    };
  }, [refreshKey, sessionId]);

  useEffect(() => {
    const channel = supabase
      .channel(`delivery-files:${sessionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'mission_files',
        filter: `session_id=eq.${sessionId}`,
      }, () => {
        void getDeliveryFiles(sessionId)
          .then((deliveryFiles) => {
            setFiles(deliveryFiles);
            return Promise.all(
              deliveryFiles
                .filter((file) => file.mime_type?.startsWith('audio/'))
                .map(async (file) => [file.id, await getSignedUrl('delivery-files', file.file_url)] as const),
            );
          })
          .then((entries) => {
            setAudioUrls(Object.fromEntries(entries));
          })
          .catch(() => undefined);
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const sortedFiles = useMemo(
    () => [...files].sort((left, right) => right.created_at.localeCompare(left.created_at)),
    [files],
  );

  const handleUpload = async (file: File) => {
    const uploaded = await uploadDeliveryFile(sessionId, missionId, file);
    setFiles((previous) => [uploaded, ...previous.filter((entry) => entry.id !== uploaded.id)]);
    if (uploaded.mime_type?.startsWith('audio/')) {
      const signedUrl = await getSignedUrl('delivery-files', uploaded.file_url);
      setAudioUrls((previous) => ({ ...previous, [uploaded.id]: signedUrl }));
    }
    setShowUpload(false);
  };

  const handleDelete = async (file: MissionFileRecord) => {
    if (!window.confirm(`Supprimer définitivement "${file.file_name}" ?`)) {
      return;
    }

    setDeletingFileId(file.id);
    try {
      await deleteFile(file.id, 'delivery-files', file.file_url);
      setFiles((previous) => previous.filter((entry) => entry.id !== file.id));
      setAudioUrls((previous) => {
        const next = { ...previous };
        delete next[file.id];
        return next;
      });
      showToast({
        title: 'Fichier supprimé',
        description: `${file.file_name} a été retiré des livraisons.`,
        variant: 'default',
      });
    } catch (deleteError) {
      const message = toUserFacingErrorMessage(deleteError, 'Impossible de supprimer ce fichier.');
      setError(message);
      showToast({
        title: 'Suppression impossible',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setDeletingFileId(null);
    }
  };

  const handleDownload = async (file: MissionFileRecord) => {
    try {
      const signedUrl = await getSignedUrl('delivery-files', file.file_url);
      window.open(signedUrl, '_blank', 'noopener,noreferrer');
    } catch (downloadError) {
      showToast({
        title: 'Téléchargement impossible',
        description: toUserFacingErrorMessage(downloadError, 'Impossible de générer le lien.'),
        variant: 'destructive',
      });
    }
  };

  return (
    <section id="delivery-panel" className="mt-6 rounded-3xl border border-white/50 bg-white/80 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Livraisons</h2>
          <p className="text-xs text-gray-400">Fichiers déposés pour cette session.</p>
        </div>

        {canUpload ? (
          <button
            id="btn-upload-delivery"
            type="button"
            onClick={() => setShowUpload((previous) => !previous)}
            className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-medium text-orange-600 transition-colors hover:bg-orange-100"
          >
            {showUpload ? 'Fermer' : 'Déposer un fichier'}
          </button>
        ) : null}
      </div>

      {showUpload ? (
        <div className="mt-4">
          <FileUpload
            label="Fichiers de livraison"
            accept="audio/*,.pdf,.zip"
            maxSizeMb={500}
            onUpload={handleUpload}
            existingFiles={[]}
            helperText="WAV, MP3, PDF ou ZIP jusqu’à 500 Mo."
          />
        </div>
      ) : null}

      {loading ? (
        <div className="mt-4 text-sm text-gray-400">Chargement des fichiers…</div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      {!loading && !error && sortedFiles.length === 0 ? (
        <p className="mt-4 text-sm text-gray-400">Aucun fichier livré pour le moment.</p>
      ) : null}

      {!loading && !error && sortedFiles.length > 0 ? (
        <div className="mt-4 space-y-3">
          {sortedFiles.map((file) => {
            const canDelete = currentUserId !== null && file.uploaded_by === currentUserId;
            return (
              <div
                key={file.id}
                className="delivery-file-item rounded-2xl border border-white/50 bg-white px-3 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-50">
                    {fileIcon(file)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{file.file_name}</p>
                    <p className="text-xs text-gray-400">{formatFileSize(file.file_size)}</p>
                  </div>

                  <button
                    id={`btn-download-${file.id}`}
                    type="button"
                    onClick={() => {
                      void handleDownload(file);
                    }}
                    className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-orange-50 hover:text-orange-600"
                  >
                    Télécharger
                  </button>
                </div>

                {file.mime_type?.startsWith('audio/') && audioUrls[file.id] ? (
                  <audio controls src={audioUrls[file.id]} className="mt-3 w-full" />
                ) : null}

                {canDelete ? (
                  <div className="mt-3">
                    <button
                      id={`btn-delete-file-${file.id}`}
                      type="button"
                      disabled={deletingFileId === file.id}
                      onClick={() => {
                        void handleDelete(file);
                      }}
                      className="text-xs font-medium text-red-500 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingFileId === file.id ? 'Suppression…' : 'Supprimer'}
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
