import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '탑뷰 픽 스튜디오',
  description: '숫자 상품번호로 찾는 짧고 믿을 수 있는 상품 리뷰',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
