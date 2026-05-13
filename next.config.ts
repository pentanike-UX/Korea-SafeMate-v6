import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  transpilePackages: ["maplibre-gl"],
  // Turbopack 키를 제거하여 webpack 모드 사용
  // Turbopack은 PostCSS 실행 전 CSS @import를 resolve 시도 → tailwindcss 못 찾음
  // webpack은 postcss-loader가 먼저 실행되어 @import "tailwindcss"를 처리 후 css-loader 실행

  // Next.js 16의 cross-origin dev 차단(`allowedDevOrigins`) 우회.
  // LAN IP/mDNS hostname로 dev 서버에 접근하면 기본적으로 client manifest가
  // 안전상 차단되어 React hydration이 silently 실패한다.
  // 사설 IPv4 대역 + `.local` mDNS을 와일드카드로 명시적 허용한다.
  allowedDevOrigins: [
    "10.*.*.*",
    "172.16.*.*",
    "172.17.*.*",
    "172.18.*.*",
    "172.19.*.*",
    "172.2*.*.*",
    "172.30.*.*",
    "172.31.*.*",
    "192.168.*.*",
    "*.local",
  ],
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
      // Google Places Photo Media (New API) — photoUri CDN
      { protocol: "https", hostname: "lh3.googleusercontent.com", pathname: "/**" },
      { protocol: "https", hostname: "lh4.googleusercontent.com", pathname: "/**" },
      { protocol: "https", hostname: "lh5.googleusercontent.com", pathname: "/**" },
      { protocol: "https", hostname: "lh6.googleusercontent.com", pathname: "/**" },
      // Google Maps Static / Street View
      { protocol: "https", hostname: "maps.googleapis.com", pathname: "/**" },
      { protocol: "https", hostname: "maps.gstatic.com", pathname: "/**" },
    ],
  },
};

export default withNextIntl(nextConfig);
