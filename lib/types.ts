export type Marketplace = 'coupang' | 'temu' | 'aliexpress';

export type ProductStatus =
  | 'draft'
  | 'queued'
  | 'generating'
  | 'ready'
  | 'failed';

export type Product = {
  code: string;
  order: number;
  category: string;
  marketplace: Marketplace;
  sourceUrl: string;
  affiliateUrl: string;
  name: string;
  description: string;
  imageUrl: string;
  videoUrl: string | null;
  status: ProductStatus;
  disclosure: string;
  createdAt: string;
  updatedAt: string;
};

export type RowInput = {
  order?: number;
  category?: string;
  marketplace?: Marketplace;
  sourceUrl?: string;
  affiliateUrl?: string;
  name: string;
  description: string;
  imageUrl: string;
  videoUrl?: string | null;
  status?: ProductStatus;
  disclosure?: string;
};

export const MARKETPLACE_NAMES: Record<Marketplace, string> = {
  coupang: '쿠팡',
  temu: '테무',
  aliexpress: '알리익스프레스',
};

export const STATUS_NAMES: Record<ProductStatus, string> = {
  draft: '준비 중',
  queued: '제작 대기',
  generating: '영상 제작 중',
  ready: '영상 준비 완료',
  failed: '제작 실패',
};

export const DISCLOSURE_DEFAULT =
  '제휴 링크를 통한 구매 시 수수료를 받을 수 있습니다.';
