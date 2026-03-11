import { Helmet } from "react-helmet-async";

const SITE_NAME = "Montera";
const BASE_URL = "https://crypto-montera.vercel.app";
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.png`;

interface SEOProps {
    title?: string;
    description?: string;
    canonical?: string;
    ogImage?: string;
    noIndex?: boolean;
}

/**
 * Drop this component at the top of any page to set
 * its <title>, meta description, canonical URL, and OG tags.
 *
 * Usage:
 *   <SEO title="Dashboard" description="Your portfolio overview" />
 *   → <title>Dashboard | Montera</title>
 */
const SEO = ({
    title,
    description = "Zero fees. Instant settlement. Bank-grade security. A professional crypto investment platform built for investors who demand more.",
    canonical,
    ogImage = DEFAULT_OG_IMAGE,
    noIndex = false,
}: SEOProps) => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Crypto Investment Platform`;

    return (
        <Helmet>
            {/* ── Primary ─────────────────────────────────────────── */}
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            {canonical && <link rel="canonical" href={`${BASE_URL}${canonical}`} />}
            {noIndex && <meta name="robots" content="noindex, nofollow" />}

            {/* ── Open Graph ──────────────────────────────────────── */}
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={ogImage} />
            <meta property="og:type" content="website" />
            {canonical && <meta property="og:url" content={`${BASE_URL}${canonical}`} />}

            {/* ── Twitter ─────────────────────────────────────────── */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={ogImage} />
        </Helmet>
    );
};

export default SEO;
