import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  noIndex?: boolean;
}

const SITE_NAME = 'StudioLink';
const DEFAULT_DESC = 'La plateforme qui connecte les studios creatifs avec les professionnels independants.';
const BASE_URL = 'https://studiolink-paris.vercel.app';
const OG_IMAGE = `${BASE_URL}/og-image.jpg`;

export function SEO({
  title,
  description = DEFAULT_DESC,
  image = OG_IMAGE,
  url,
  noIndex = false,
}: SEOProps) {
  const fullTitle = title ? `${title} — ${SITE_NAME}` : SITE_NAME;
  const canonicalUrl = url ? `${BASE_URL}${url}` : BASE_URL;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description.substring(0, 160)} />
      {noIndex ? <meta name="robots" content="noindex,nofollow" /> : null}
      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:type" content="website" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content={SITE_NAME} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
}
