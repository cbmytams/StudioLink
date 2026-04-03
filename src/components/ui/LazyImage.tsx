type LazyImageProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  fallback?: string;
};

export function LazyImage({ src, alt, width, height, className, fallback }: LazyImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading="lazy"
      decoding="async"
      style={{ aspectRatio: `${width}/${height}` }}
      onError={(event) => {
        if (!fallback) return;
        (event.target as HTMLImageElement).src = fallback;
      }}
    />
  );
}
