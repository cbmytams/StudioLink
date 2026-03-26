import { type ChangeEvent, useRef, useState } from 'react';
import { FileAudio, FileArchive, FileText, Trash2, Upload } from 'lucide-react';
import { useAuth } from '@/lib/supabase/auth';
import type { MissionFileRecord } from '@/types/backend';
import { classifyMissionAsset, formatFileSize, validateStorageFile } from '@/lib/files/fileUtils';
import { useToast } from '@/components/ui/Toast';

type FileUploadProps = {
  onUpload: (file: File) => Promise<void>;
  accept: string;
  maxSizeMb?: number;
  label: string;
  existingFiles: MissionFileRecord[];
  onDelete?: (file: MissionFileRecord) => Promise<void> | void;
  disabled?: boolean;
  helperText?: string;
};

function fileIcon(file: MissionFileRecord) {
  if (file.mime_type?.startsWith('audio/')) return <FileAudio className="h-4 w-4 text-orange-500" />;
  if (file.mime_type === 'application/zip' || file.mime_type === 'application/x-zip-compressed') {
    return <FileArchive className="h-4 w-4 text-orange-500" />;
  }
  return <FileText className="h-4 w-4 text-orange-500" />;
}

export function FileUpload({
  onUpload,
  accept,
  maxSizeMb = 500,
  label,
  existingFiles,
  onDelete,
  disabled = false,
  helperText,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { session } = useAuth();
  const { showToast } = useToast();

  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const currentUserId = session?.user?.id ?? null;

  const handleFile = async (file?: File) => {
    if (!file || uploading || disabled) return;

    const validation = validateStorageFile(file, { accept, maxSizeMb });
    if (!validation.ok) {
      showToast({
        title: 'Fichier refusé',
        description: validation.error,
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    setProgress(18);

    try {
      setProgress(62);
      await onUpload(file);
      setProgress(100);
      showToast({
        title: 'Fichier ajouté',
        description: file.name,
        variant: 'default',
      });
    } catch (uploadError) {
      showToast({
        title: 'Upload impossible',
        description: uploadError instanceof Error ? uploadError.message : 'Impossible de déposer ce fichier.',
        variant: 'destructive',
      });
    } finally {
      window.setTimeout(() => {
        setUploading(false);
        setProgress(0);
      }, 180);
    }
  };

  const handleInputChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    await handleFile(file);
  };

  const handleDelete = async (file: MissionFileRecord) => {
    if (!onDelete || deletingId) return;

    setDeletingId(file.id);
    try {
      await onDelete(file);
      showToast({
        title: 'Fichier supprimé',
        description: file.file_name,
        variant: 'default',
      });
    } catch (deleteError) {
      showToast({
        title: 'Suppression impossible',
        description: deleteError instanceof Error ? deleteError.message : 'Impossible de supprimer ce fichier.',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section>
      <div className="mb-2">
        <p className="block text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
        {helperText ? <p className="mt-1 text-xs text-gray-400">{helperText}</p> : null}
      </div>

      <button
        id="file-dropzone"
        type="button"
        disabled={disabled || uploading}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          if (disabled) return;
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragOver(false);
          void handleFile(event.dataTransfer.files?.[0]);
        }}
        className={`flex min-h-[96px] w-full flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-5 text-center transition-colors ${
          disabled
            ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-300'
            : isDragOver
              ? 'border-orange-300 bg-orange-50 text-orange-600'
              : 'border-gray-200 bg-white text-gray-500 hover:bg-orange-50 hover:text-orange-600'
        }`}
      >
        <Upload className="mb-2 h-5 w-5" />
        <span className="text-sm font-medium">
          {disabled ? 'Crée la mission pour déposer des fichiers' : 'Glisser-déposer ou cliquer pour choisir'}
        </span>
        <span className="mt-1 text-xs text-gray-400">
          Max {maxSizeMb} Mo · {accept}
        </span>
      </button>

      <input
        id="file-input"
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept}
        disabled={disabled || uploading}
        onChange={(event) => {
          void handleInputChange(event);
        }}
      />

      {uploading ? (
        <div className="upload-progress mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-orange-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      ) : null}

      {existingFiles.length > 0 ? (
        <div className="mt-3 space-y-2">
          {existingFiles.map((file) => {
            const assetType = classifyMissionAsset({ type: file.mime_type, name: file.file_name });
            const canDelete = currentUserId !== null && file.uploaded_by === currentUserId && Boolean(onDelete);

            return (
              <div
                key={file.id}
                className="file-item flex items-center gap-3 rounded-2xl border border-white/50 bg-white px-3 py-3"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-50">
                  {assetType === 'audio'
                    ? <FileAudio className="h-4 w-4 text-orange-500" />
                    : fileIcon(file)}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="file-item-name truncate text-sm font-medium text-gray-900">{file.file_name}</p>
                  <p className="file-item-size text-xs text-gray-400">{formatFileSize(file.file_size)}</p>
                </div>

                {canDelete ? (
                  <button
                    id={`btn-delete-file-${file.id}`}
                    type="button"
                    onClick={() => {
                      void handleDelete(file);
                    }}
                    disabled={deletingId === file.id}
                    className="rounded-full p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                    aria-label={`Supprimer ${file.file_name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
