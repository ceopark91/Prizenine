import { sheetsEnabled, listProducts, getProduct, createProduct, updateProduct } from './sheets';
import { demoProducts, demoFind } from './demo';
import type { Product, RowInput } from './types';

export async function getAllProducts(): Promise<Product[]> {
  if (sheetsEnabled()) {
    try {
      const fromSheet = await listProducts();
      if (fromSheet.length > 0) return fromSheet;
    } catch (err) {
      console.error('Sheets 조회 실패, 데모 데이터 사용:', err);
    }
  }
  return demoProducts;
}

export async function getProductByCode(code: string): Promise<Product | null> {
  if (sheetsEnabled()) {
    try {
      const found = await getProduct(code);
      if (found) return found;
    } catch (err) {
      console.error('Sheets 상품 조회 실패:', err);
    }
  }
  return demoFind(code);
}

export async function addProduct(input: RowInput): Promise<Product> {
  if (!sheetsEnabled()) {
    throw new Error('Google Sheets가 설정되지 않아 상품을 등록할 수 없습니다.');
  }
  return createProduct(input);
}

export async function editProduct(
  code: string,
  patch: Partial<RowInput>,
): Promise<Product | null> {
  if (!sheetsEnabled()) {
    throw new Error('Google Sheets가 설정되지 않아 상품을 갱신할 수 없습니다.');
  }
  return updateProduct(code, patch);
}
