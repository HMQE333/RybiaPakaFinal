import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const allowInsecureAssets = process.env.ALLOW_INSECURE_ASSETS === "1";
const enableUpgradeInsecure = isProd && !allowInsecureAssets;
const enableHsts = isProd && !allowInsecureAssets;
const imgSrc = isProd
  ? "img-src 'self' data: blob: https:"
  : "img-src 'self' data: blob: https: http:";
const connectSrc = isProd
  ? "connect-src 'self' https: wss:"
  : "connect-src 'self' http: https: ws: wss:";
const scriptSrc = isProd
  ? "script-src 'self' 'unsafe-inline'"
  : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  imgSrc,
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  scriptSrc,
  connectSrc,
  ...(enableUpgradeInsecure ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), accelerometer=(), gyroscope=(), magnetometer=()",
  },
  ...(enableHsts
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
] as Array<{ key: string; value: string }>;

const cacheHeaders = [
  {
    source: "/uploads/:path*",
    headers: [
      { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
    ],
  },
  {
    source: "/avatars/:path*",
    headers: [
      { key: "Cache-Control", value: "public, max-age=604800, immutable" },
    ],
  },
  {
    source: "/artwork/:path*",
    headers: [
      { key: "Cache-Control", value: "public, max-age=604800, immutable" },
    ],
  },
  {
    source: "/emojis/:path*",
    headers: [
      { key: "Cache-Control", value: "public, max-age=604800, immutable" },
    ],
  },
];

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      ...cacheHeaders,
    ];
  },
};

export default nextConfig;
