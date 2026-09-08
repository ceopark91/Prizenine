import Link from 'next/link';
import { SiteHeader } from '@/components/site-header';
import { AdminPanel } from './admin-panel';

export default async function AdminPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-[var(--primary)]">ADMIN</p>
            <h1 className="display mt-1 text-3xl font-black">운영자 패널</h1>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              상품을 등록하고 영상 제작 상태를 관리합니다. 데이터는 Google
              Sheets에 기록됩니다.
            </p>
          </div>
          <Link href="/" className="text-sm font-semibold text-[var(--muted-foreground)] hover:text-[var(--primary)]">
            ← 사이트 보기
          </Link>
        </div>
        <AdminPanel />
      </main>
    </>
  );
}
