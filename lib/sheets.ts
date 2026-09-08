import { google } from 'googleapis';
import type {
  Product,
  RowInput,
  Marketplace,
  ProductStatus,
} from './types';
import { DISCLOSURE_DEFAULT } from './types';
import { classifyCategory } from './classify';
import { marketplaceFromUrl } from './marketplace';

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = process.env.GOOGLE_SHEET_NAME || '시트1';
const AUTH_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;

const HEADERS = [
  'order',
  'code',
  'marketplace',
  'source_url',
  'affiliate_url',
  'name',
  'description',
  'image_url',
  'video_url',
  'status',
  'disclosure',
  'created_at',
  'updated_at',
] as const;

const LEGACY_HEADERS = ['제품번호', '카테고리', '상품명', '브랜드/제품설명', '쿠팡 구매링크', '상품이미지', '영상URL', '상태', '등록일', '수정일'] as const;
const LEGACY_HEADER_PREFIX = LEGACY_HEADERS.slice(0, 6);

function credentialsConfigured() {
  return Boolean(SHEET_ID && AUTH_EMAIL && PRIVATE_KEY);
}

// 서비스 계정 인증을 위한 JWT 단일 인스턴스 재사용
let jwtClient: InstanceType<typeof google.auth.GoogleAuth> | null = null;

async function getAuth() {
  if (!credentialsConfigured()) {
    throw new Error(
      'Google Sheets 설정이 없습니다. GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY 환경변수를 확인하세요.',
    );
  }
  if (!jwtClient) {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: AUTH_EMAIL!,
        private_key: PRIVATE_KEY!.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    jwtClient = auth;
  }
  return jwtClient;
}

export function sheetsEnabled() {
  return credentialsConfigured();
}

async function readHeaderRow() {
  const auth = await getAuth();
  const sheets = google.sheets({ version: 'v4', auth: auth as any });
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID!, range: `${SHEET_NAME}!A1:M1` });
  return res.data.values?.[0]?.map((v) => String(v ?? '').trim()) ?? [];
}

async function ensureHeaderRow() {
  const auth = await getAuth();
  const sheets = google.sheets({ version: 'v4', auth: auth as any });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID!,
    range: `${SHEET_NAME}!A1:M1`,
  });

  const existing = res.data.values?.[0] ?? [];
  if (existing.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID!,
      range: `${SHEET_NAME}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [HEADERS as unknown as string[]] },
    });
  }
  if (LEGACY_HEADER_PREFIX.every((header, index) => String(existing[index] ?? '').trim() === header)) {
    const missing = LEGACY_HEADERS.slice(existing.length, LEGACY_HEADERS.length);
    if (missing.length > 0) await sheets.spreadsheets.values.update({ spreadsheetId: SHEET_ID!, range: `${SHEET_NAME}!${String.fromCharCode(65 + existing.length)}1`, valueInputOption: 'RAW', requestBody: { values: [missing as unknown as string[]] } });
  }
}

function rowToProduct(values: (string | number | null | undefined)[], legacy = false): Product {
  if (legacy) {
    const v = (i: number) => (values[i] == null ? '' : String(values[i]).trim());
    const code = v(0);
    const name = v(2);
    const description = v(3);
    const videoUrl = v(6) || null;
    const createdAt = v(8) || new Date().toISOString();
    let marketplace: Marketplace = 'coupang';
    try { marketplace = marketplaceFromUrl(v(4)) as Marketplace; } catch { /* legacy rows may contain a placeholder link */ }
    return { order: Number(code) || 0, code, category: v(1) || classifyCategory(name, description), marketplace, sourceUrl: v(4), affiliateUrl: v(4), name, description, imageUrl: v(5), videoUrl, status: (v(7) || (videoUrl ? 'ready' : 'draft')) as ProductStatus, disclosure: DISCLOSURE_DEFAULT, createdAt, updatedAt: v(9) || createdAt };
  }
  const v = (i: number) => (values[i] == null ? '' : String(values[i]).trim());
  const order = Number(v(0) || 0);
  const code = v(1);
  const createdAt = v(11) || new Date().toISOString();
  const updatedAt = v(12) || createdAt;
  return {
    order,
    code,
    category: v(13) || classifyCategory(v(5), v(6)),
    marketplace: (v(2) || 'coupang') as Marketplace,
    sourceUrl: v(3),
    affiliateUrl: v(4),
    name: v(5),
    description: v(6),
    imageUrl: v(7),
    videoUrl: v(8) || null,
    status: (v(9) || 'draft') as ProductStatus,
    disclosure: v(10) || DISCLOSURE_DEFAULT,
    createdAt,
    updatedAt,
  };
}

export async function listProducts(): Promise<Product[]> {
  if (!sheetsEnabled()) return [];
  const auth = await getAuth();
  const sheets = google.sheets({ version: 'v4', auth: auth as any });

  await ensureHeaderRow();

  const header = await readHeaderRow();
  const legacy = LEGACY_HEADER_PREFIX.every((value, index) => header[index] === value);
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID!,
    range: `${SHEET_NAME}!A2:${legacy ? 'J' : 'M'}1000`,
  });

  const rows = res.data.values ?? [];
  const products = rows
    .map((row) => rowToProduct(row, legacy))
    .filter((p) => p.code)
    .sort((a, b) => a.order - b.order || a.code.localeCompare(b.code));
  return products;
}

export async function getProduct(code: string): Promise<Product | null> {
  const products = await listProducts();
  return products.find((p) => p.code === code) ?? null;
}

function nextCode(products: Product[], legacy = false): string {
  if (legacy) {
    const max = products.reduce((value, product) => {
      const numeric = Number.parseInt(product.code, 10);
      return Number.isFinite(numeric) ? Math.max(value, numeric) : value;
    }, 0);
    return String(max + 1);
  }
  const used = new Set(products.map((p) => p.code));
  let code = String(Math.floor(100000 + Math.random() * 900000));
  while (used.has(code)) {
    code = String(Math.floor(100000 + Math.random() * 900000));
  }
  return code;
}

/** 상품 신규 등록. 시트에 행을 추가하고 만든 상품을 반환한다. */
export async function createProduct(input: RowInput): Promise<Product> {
  const auth = await getAuth();
  const sheets = google.sheets({ version: 'v4', auth: auth as any });
  await ensureHeaderRow();
  const legacy = (await readHeaderRow()).slice(0, 6).every((value, index) => value === LEGACY_HEADER_PREFIX[index]);

  const products = await listProducts();
  const code = nextCode(products, legacy);
  const category = input.category || classifyCategory(input.name, input.description);
  const sourceUrl = input.sourceUrl || input.affiliateUrl || '';
  const marketplace = input.marketplace || marketplaceFromUrl(sourceUrl || '');
  const now = new Date().toISOString();
  const order =
    (input.order ?? 0) > 0 ? input.order! : Math.max(0, ...products.map((p) => p.order)) + 1;

  const values = legacy
    ? [category, input.name, input.description, input.affiliateUrl || sourceUrl, input.imageUrl, input.videoUrl || '', input.status || 'draft', now, now]
    : [order, code, marketplace, sourceUrl, input.affiliateUrl, input.name, input.description, input.imageUrl, input.videoUrl || '', input.status || 'draft', input.disclosure || DISCLOSURE_DEFAULT, now, now];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID!,
    range: `${SHEET_NAME}!${legacy ? 'B1' : 'A1'}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [values] },
  });

  if (legacy) {
    const refreshed = await listProducts();
    const matched = refreshed.find((product) => product.name === input.name && product.affiliateUrl === (input.affiliateUrl || sourceUrl));
    if (matched) return matched;
  }
  return {
    order,
    code,
    category,
    marketplace,
    sourceUrl: sourceUrl || '',
    affiliateUrl: input.affiliateUrl || sourceUrl,
    name: input.name,
    description: input.description,
    imageUrl: input.imageUrl,
    videoUrl: input.videoUrl || null,
    status: input.status || 'draft',
    disclosure: input.disclosure || DISCLOSURE_DEFAULT,
    createdAt: now,
    updatedAt: now,
  } as Product;
}

/** 기존 상품의 필드를 갱신한다. code가 곧 시트의 행 키가 된다. */
export async function updateProduct(
  code: string,
  patch: Partial<RowInput>,
): Promise<Product | null> {
  const auth = await getAuth();
  const sheets = google.sheets({ version: 'v4', auth: auth as any });
  await ensureHeaderRow();
  const legacy = (await readHeaderRow()).slice(0, 6).every((value, index) => value === LEGACY_HEADER_PREFIX[index]);

  const products = await listProducts();
  const idx = products.findIndex((p) => p.code === code);
  if (idx === -1) return null;

  // 시트의 원본 행 번호 (헤더 1행 다음이므로 data row = idx + 2)
  const rowNumber = idx + 2;
  const existing = products[idx];

  const next: Product = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString(),
  };

  const values = legacy
    ? [next.category, next.name, next.description, next.affiliateUrl, next.imageUrl, next.videoUrl || '', next.status, next.createdAt, next.updatedAt]
    : [next.order, next.code, next.marketplace, next.sourceUrl, next.affiliateUrl, next.name, next.description, next.imageUrl, next.videoUrl || '', next.status, next.disclosure, next.createdAt, next.updatedAt];

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID!,
    range: `${SHEET_NAME}!${legacy ? 'B' : 'A'}${rowNumber}:${legacy ? 'J' : 'M'}${rowNumber}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [values] },
  });

  return next;
}
