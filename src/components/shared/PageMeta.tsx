import { Helmet } from 'react-helmet-async';

type PageMetaProps = {
  title: string;
  description?: string;
  canonicalPath?: string;
};

function getAppName() {
  return import.meta.env.VITE_APP_NAME || 'StudioLink';
}

function getCanonicalUrl(canonicalPath?: string) {
  const appUrl = import.meta.env.VITE_APP_URL;
  if (!appUrl || !canonicalPath) return null;
  return new URL(canonicalPath, appUrl).toString();
}

export function PageMeta({ title, description, canonicalPath }: PageMetaProps) {
  const appName = getAppName();
  const canonicalUrl = getCanonicalUrl(canonicalPath);
  const finalTitle = `${title} | ${appName}`;

  return (
    <Helmet>
      <title>{finalTitle}</title>
      {description ? <meta name="description" content={description} /> : null}
      <meta property="og:title" content={finalTitle} />
      {description ? <meta property="og:description" content={description} /> : null}
      {canonicalUrl ? <link rel="canonical" href={canonicalUrl} /> : null}
    </Helmet>
  );
}

