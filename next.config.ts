import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n.ts");

const nextConfig: NextConfig = {
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  // Без этого Next.js убирал бы слеш в /api/subjects/ до прокси в src/proxy.ts,
  // а backend отвечает на такие пути переадресацией на свой http-адрес.
  skipTrailingSlashRedirect: true,
  partialPrefetching: true,
  reactCompiler: true,
  turbopack: {
    rules: {
      "**/src/app/globals.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withNextIntl(nextConfig);
