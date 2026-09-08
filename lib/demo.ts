import type { Product, Marketplace, ProductStatus } from './types';
import { DISCLOSURE_DEFAULT } from './types';

type DemoSeed = {
  code: string;
  category: string;
  marketplace: Marketplace;
  status: ProductStatus;
  name: string;
  description: string;
};

const seeds: DemoSeed[] = [
  {
    code: '240101',
    category: '생활',
    marketplace: 'coupang',
    status: 'ready',
    name: '접이식 무선 미니 선풍기',
    description:
      '책상 위와 여행 가방에 부담 없이 넣는 충전식 미니 선풍기입니다.',
  },
  {
    code: '240102',
    category: '테크',
    marketplace: 'temu',
    status: 'queued',
    name: '데스크 케이블 정리 트레이',
    description:
      '책상 아래 선을 깔끔하게 숨기고 필요한 케이블만 꺼내 쓰는 정리 트레이입니다.',
  },
  {
    code: '240103',
    category: '여행',
    marketplace: 'aliexpress',
    status: 'draft',
    name: '컴팩트 여행용 파우치 세트',
    description:
      '작은 소지품을 카테고리별로 나눠 담기 좋은 여행용 파우치 세트입니다.',
  },
];

const IMAGES: Record<number, string> = {
  0: 'https://images.unsplash.com/photo-1591091869911-2c1c12e5a3a4?auto=format&fit=crop&w=1000&q=85',
  1: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&w=1000&q=85',
  2: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1000&q=85',
};

const AFFILIATE: Record<Marketplace, string> = {
  coupang: 'https://www.coupang.com/',
  temu: 'https://www.temu.com/',
  aliexpress: 'https://www.aliexpress.com/',
};

export const demoProducts: Product[] = seeds.map((seed, i) => ({
  order: i + 1,
  code: seed.code,
  category: seed.category,
  marketplace: seed.marketplace,
  sourceUrl: AFFILIATE[seed.marketplace],
  affiliateUrl: AFFILIATE[seed.marketplace],
  name: seed.name,
  description: seed.description,
  imageUrl: IMAGES[i],
  videoUrl: seed.status === 'ready' ? null : null,
  status: seed.status,
  disclosure: DISCLOSURE_DEFAULT,
  createdAt: new Date(Date.UTC(2026, 8, 1 - i)).toISOString(),
  updatedAt: new Date(Date.UTC(2026, 8, 2 - i)).toISOString(),
}));

export function demoFind(code: string): Product | null {
  return demoProducts.find((p) => p.code === code) ?? null;
}
