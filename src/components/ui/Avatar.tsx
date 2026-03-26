import { useMemo, useState } from 'react';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

type AvatarProps = {
  src?: string | null;
  name: string;
  size?: AvatarSize;
  className?: string;
};

const SIZE_CLASSES: Record<AvatarSize, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
  xl: 'h-20 w-20 text-2xl',
};

export function Avatar({ src, name, size = 'md', className = '' }: AvatarProps) {
  const [hasError, setHasError] = useState(false);

  const initials = useMemo(() => (
    name
      .split(' ')
      .map((part) => part.trim().charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?'
  ), [name]);

  const sizeClass = SIZE_CLASSES[size];

  if (!src || hasError) {
    return (
      <div
        className={`${sizeClass} inline-flex items-center justify-center rounded-full bg-gray-100 font-semibold text-gray-600 ${className}`}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      className={`${sizeClass} rounded-full object-cover ${className}`}
      loading="lazy"
      decoding="async"
      onError={() => setHasError(true)}
    />
  );
}
