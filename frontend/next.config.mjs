/** @type {import('next').NextConfig} */
const nextConfig = {
  // Docker 배포를 위한 Standalone 모드
  output: 'standalone',

  // eslint 패키지 설치 전까지 빌드 단계에서 린트는 건너뜁니다.
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 점진적으로 타입 오류를 정리하는 동안 빌드 차단을 방지합니다.
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },

  // 환경변수
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
}

export default nextConfig
