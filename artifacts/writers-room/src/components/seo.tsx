import { Helmet } from "react-helmet-async";

const SITE_URL = "https://jointhewritersroom.com";
const DEFAULT_OG_IMAGE = `${SITE_URL}/opengraph.jpg`;
const SITE_NAME = "The Writers Room";

interface SEOProps {
  title?: string;
  description?: string;
  ogType?: "website" | "profile";
  ogImage?: string;
  canonicalPath?: string;
  noIndex?: boolean;
  schema?: Record<string, unknown> | Record<string, unknown>[];
}

export function SEO({
  title,
  description = "The Writers Room — build a Writing Room around your manuscript with genre-matched collaborators, then publish to Amazon, Apple Books, Kobo, and beyond.",
  ogType = "website",
  ogImage = DEFAULT_OG_IMAGE,
  canonicalPath,
  noIndex = false,
  schema,
}: SEOProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const canonical = canonicalPath ? `${SITE_URL}${canonicalPath}` : undefined;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      {canonical && <link rel="canonical" href={canonical} />}

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={ogImage} />
      {canonical && <meta property="og:url" content={canonical} />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(Array.isArray(schema) ? schema : schema)}
        </script>
      )}
    </Helmet>
  );
}

export const SOFTWARE_APP_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "The Writers Room",
  "url": SITE_URL,
  "applicationCategory": "WritingApplication",
  "operatingSystem": "Web",
  "description": "A collaborative writing platform where authors pitch, write, edit, and publish with genre-matched contributors. Features inline diff suggestions, IP protection, contribution certificates, and multi-format export.",
  "offers": [
    {
      "@type": "Offer",
      "name": "Free",
      "price": "0",
      "priceCurrency": "GBP",
      "description": "One active project, full collaboration toolkit, IP protection, contribution certificates, EPUB & DOCX export."
    },
    {
      "@type": "Offer",
      "name": "Pro",
      "price": "5",
      "priceCurrency": "GBP",
      "billingIncrement": "month",
      "description": "Unlimited active projects, Pro badge, priority Pitches listing, early access to new features."
    }
  ],
  "publisher": {
    "@type": "Organization",
    "name": "The Writers Room",
    "url": SITE_URL
  }
};
