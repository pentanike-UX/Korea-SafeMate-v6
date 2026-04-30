import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  transpilePackages: ["maplibre-gl"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      // Naver Image Search 썸네일·원본 (서버 프록시 경유 URL)
      { protocol: "https", hostname: "search.pstatic.net", pathname: "/**" },
      { protocol: "https", hostname: "ssl.pstatic.net", pathname: "/**" },
      { protocol: "https", hostname: "phinf.pstatic.net", pathname: "/**" },
      { protocol: "https", hostname: "blogfiles.pstatic.net", pathname: "/**" },
      { protocol: "https", hostname: "upload.wikimedia.org", pathname: "/**" },
    ],
  },
};

export default withNextIntl(nextConfig);
