import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 이 프로젝트(vercel-hub)가 루트임을 명시해 상위 워크스페이스의
  // lockfile 감지 경고와 파일 추적 범위 오류를 방지한다.
  outputFileTracingRoot: __dirname,
  // D 드라이브 용량이 부족해 빌드 산출물(.next)을 C 드라이브에 쓴다.
  // Vercel 배포는 자체 샌드박스에서 다시 빌드하므로 로컬 distDir 위치는 무관하다.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // D 드라이브 용량이 부족해 영구 webpack cache를 비활성화한다.
  webpack: (config) => {
    config.cache = false;
    return config;
  },
};

export default nextConfig;
