import {
  SITE_ALTERNATE_NAME,
  SITE_LOGO_PATH,
  SITE_NAME,
  SITE_URL,
  toAbsoluteUrl,
} from "@/lib/seo";

export default function SeoStructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: SITE_NAME,
        alternateName: SITE_ALTERNATE_NAME,
        url: SITE_URL,
        logo: toAbsoluteUrl(SITE_LOGO_PATH),
      },
      {
        "@type": "WebSite",
        name: SITE_NAME,
        url: SITE_URL,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
