import { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface FileUploadProps {
  bucket: string;
  onUpload: (url: string) => void;
  accept?: string;
  maxMB?: number;
}

export function FileUpload({ bucket, onUpload, accept, maxMB = 10 }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFile = async (file?: File) => {
    if (!file) return;
    setError(null);
    if (file.size > maxMB * 1024 * 1024) {
      setError(`Fichier trop lourd (max ${maxMB}MB).`);
      return;
    }
    if (!supabase) {
      setError('Supabase non configuré.');
      return;
    }

    if (file.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview(null);
    }

    try {
      setUploading(true);
      setProgress(20);
      const path = `${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
        upsert: false,
      });
      if (uploadError) throw uploadError;
      setProgress(85);
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      setProgress(100);
      onUpload(data.publicUrl);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Impossible d'uploader le fichier.");
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragOver(false);
          void handleFile(event.dataTransfer.files?.[0]);
        }}
        className={`w-full rounded-xl border border-dashed px-4 py-5 text-sm text-stone-600 transition-colors flex items-center justify-center gap-2 min-h-[44px] ${
          isDragOver
            ? 'border-orange-400 bg-orange-50'
            : 'border-stone-300 bg-white/70 hover:bg-white'
        }`}
      >
        <Upload size={16} />
        {isDragOver ? 'Dépose le fichier ici' : 'Ajouter un fichier'}
      </button>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept}
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />

      {preview ? (
        <div className="relative rounded-xl overflow-hidden border border-stone-200">
          <img src={preview} alt="Aperçu" className="w-full h-36 object-cover" />
          <button
            type="button"
            onClick={() => setPreview(null)}
            className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full border border-white/70 bg-white/90 text-orange-600 shadow-sm"
          >
            <X size={14} />
          </button>
        </div>
      ) : null}

      {uploading ? (
        <div className="h-2 w-full rounded-full bg-stone-200 overflow-hidden">
          <div className="h-full bg-orange-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
      ) : null}
      {error ? <p className="text-xs text-red-500">{error}</p> : null}
    </div>
  );
}
