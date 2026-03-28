import { useRef, useState, type ChangeEvent } from 'react';
import { Camera } from 'lucide-react';
import { avatarService } from '@/services/avatarService';
import { useToast } from '@/components/ui/Toast';

type AvatarUploadProps = {
  currentUrl: string | null
  fallbackLetter: string
  userId: string
  inputId?: string
  onUploadSuccess: (newUrl: string) => void
}

export function AvatarUpload({
  currentUrl,
  fallbackLetter,
  userId,
  inputId,
  onUploadSuccess,
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { showToast } = useToast();
  const [uploading, setUploading] = useState(false);

  const triggerPicker = () => {
    if (!userId || uploading) return;
    inputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !userId) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast({
        title: 'Image trop lourde',
        description: 'Image trop lourde (max 2 Mo)',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      if (currentUrl) {
        try {
          await avatarService.deleteOldAvatar(currentUrl);
        } catch {
          // On continue pour ne pas bloquer la mise à jour avec un nouvel avatar.
        }
      }

      const newUrl = await avatarService.uploadAvatar(userId, file);
      await avatarService.updateAvatarUrl(userId, newUrl);
      onUploadSuccess(newUrl);

      showToast({
        title: 'Photo mise à jour',
        description: 'Photo de profil mise à jour',
        variant: 'default',
      });
    } catch (uploadError) {
      showToast({
        title: 'Upload impossible',
        description: uploadError instanceof Error ? uploadError.message : undefined,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const letter = fallbackLetter?.trim().charAt(0).toUpperCase() || '?';

  return (
    <div>
      <button
        type="button"
        onClick={triggerPicker}
        className="group relative h-20 w-20 cursor-pointer overflow-hidden rounded-full border border-white/50"
      >
        {currentUrl ? (
          <img src={currentUrl} alt="Avatar" className="h-full w-full object-cover" loading="lazy" decoding="async" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-orange-100">
            <span className="text-2xl font-bold text-orange-600">{letter}</span>
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          {uploading ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : (
            <div className="flex flex-col items-center gap-1 text-white">
              <Camera size={14} />
              <span className="text-xs">Modifier</span>
            </div>
          )}
        </div>
      </button>

      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => {
          void handleFileChange(event);
        }}
      />
    </div>
  );
}
