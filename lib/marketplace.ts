import type { Marketplace } from './types';

export function marketplaceFromUrl(value: string): Marketplace {
  const host = new URL(value).hostname.toLowerCase().replace(/^www\./, '');
  if (host === 'coupang.com' || host.endsWith('.coupang.com')) return 'coupang';
  if (host === 'temu.com' || host.endsWith('.temu.com')) return 'temu';
  if (host === 'aliexpress.com' || host.endsWith('.aliexpress.com')) return 'aliexpress';
  throw new Error('쿠팡, 테무, 알리익스프레스 링크만 지원합니다.');
}
