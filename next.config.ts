import type { NextConfig } from "next";
const config: NextConfig = {
  output: "standalone",
  distDir: process.env.NEXT_DIST_DIR || ".next",
  serverExternalPackages: ["node:sqlite"],
  poweredByHeader: false,
  async headers() {
    const common = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    ];
    return [
      // The editor's live preview embeds this page from the same origin only.
      {
        source: "/admin/preview",
        headers: [
          ...common,
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
        ],
      },
      {
        source: "/((?!admin/preview$).*)",
        headers: [...common, { key: "X-Frame-Options", value: "DENY" }],
      },
    ];
  },
};
export default config;
