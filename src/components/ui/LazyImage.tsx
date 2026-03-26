type LazyImageProps = {
  src: string;
  alt: string;
  className?: string;
  fallback?: string;
};

export function LazyImage({ src, alt, className, fallback }: LazyImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      onError={(event) => {
        if (!fallback) return;
        (event.target as HTMLImageElement).src = fallback;
      }}
    />
  );
}
