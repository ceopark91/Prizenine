const PRODUCT_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1b_dNkuhjl2XQbc3JG4dTrjbIyszzkjLs6cP35xaHQFY/export?format=csv&gid=0';
const SUPABASE_URL = 'https://ybvnekkbbnhbcnnatkui.supabase.co';
const SUPABASE_KEY = 'sb_publishable_0-6qJZXSmiKQKsoF5FQw-w_xH-PNfWD';
const DEFAULT_PRODUCT_IMAGE = 'default-product.svg';
const fallbackProducts = [
  { number: '01', category: '생활', title: '아침을 바꾸는 작은 조명', product: '무드등 · 오늘의집', image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=360&q=85', link: 'https://www.coupang.com/' },
  { number: '02', category: '테크', title: '책상 위, 가장 예쁜 소리', product: '블루투스 스피커 · JBL', image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=360&q=85', link: 'https://www.coupang.com/' },
  { number: '03', category: '뷰티', title: '매일 쓰는 것의 기준', product: '선크림 · Beauty of Joseon', image: 'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=360&q=85', link: 'https://www.coupang.com/' },
  { number: '04', category: '생활', title: '정리의 시작은 여기서', product: '모듈 수납함 · String', image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=360&q=85', link: 'https://www.coupang.com/' },
  { number: '05', category: '테크', title: '퇴근 후 한 장의 온도', product: '필름 카메라 · Kodak', image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=360&q=85', link: 'https://www.coupang.com/' },
  { number: '06', category: '뷰티', title: '향으로 기억되는 하루', product: '오 드 퍼퓸 · Tamburins', image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=360&q=85', link: 'https://www.coupang.com/' }
];
const list = document.querySelector('#product-list');
const emptyState = document.querySelector('#empty-state');
const searchInput = document.querySelector('#search-input');
const count = document.querySelector('#product-count');
let selectedCategory = '전체';
let products = [];

function parseCsv(csv) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];
    const nextCharacter = csv[index + 1];
    if (character === '"' && quoted && nextCharacter === '"') { cell += '"'; index += 1; }
    else if (character === '"') quoted = !quoted;
    else if (character === ',' && !quoted) { row.push(cell.trim()); cell = ''; }
    else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && nextCharacter === '\n') index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = '';
    } else cell += character;
  }
  if (cell || row.length) { row.push(cell.trim()); rows.push(row); }
  const normalizeHeader = (header) => header.toLowerCase().replace(/[\s.()\-/]/g, '');
  const headers = rows.shift()?.map(normalizeHeader) || [];
  const numberHeader = headers.find((header) => header.includes('제품번호') || header === '번호') || headers[0];
  const categoryHeader = headers.find((header) => header.includes('카테고리'));
  const titleHeader = headers.find((header) => header.includes('상품명'));
  const productHeader = headers.find((header) => header.includes('브랜드') || header.includes('제품설명'));
  const linkHeader = headers.find((header) => header.includes('구매링크') || header.includes('쿠팡링크'));
  const imageHeader = headers.find((header) => header.includes('상품이미지') || header.includes('이미지'));
  return rows.map((values) => {
    const record = Object.fromEntries(headers.map((header, index) => [header, values[index] || '']));
    return {
      number: record[numberHeader] || record.number,
      category: record[categoryHeader] || record.category || '기타',
      title: record[titleHeader] || record.title,
      product: record[productHeader] || record['설명'] || record.product,
      image: record[imageHeader] || record.image || DEFAULT_PRODUCT_IMAGE,
      link: record[linkHeader] || record.link
    };
  }).filter((item) => item.number && item.title && item.link);
}

async function loadProducts() {
  products = fallbackProducts;
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/products?select=*&order=created_at.asc&limit=200`, { cache: 'no-store', headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } });
    if (!response.ok) throw new Error(`Supabase returned ${response.status}`);
    const supabaseProducts = (await response.json()).map((item) => ({ number: item.number || item.id.slice(0, 6), category: item.category || '기타', title: item.title, product: item.description || '', image: item.image || DEFAULT_PRODUCT_IMAGE, link: item.link })).filter((item) => item.title && item.link);
    if (supabaseProducts.length) products = supabaseProducts;
  } catch (error) {
    try { const response = await fetch(PRODUCT_SHEET_CSV_URL, { cache: 'no-store' }); const sheetProducts = parseCsv(await response.text()); if (sheetProducts.length) products = sheetProducts; } catch (_) { console.warn('Supabase and Google Sheet could not be loaded.', error); }
  }
  renderProducts();
}

function renderProducts() {
  const query = searchInput.value.trim().toLowerCase();
  const filtered = products.filter((item) => {
    const categoryMatch = selectedCategory === '전체' || item.category === selectedCategory;
    const queryMatch = `${item.number} ${item.title} ${item.product}`.toLowerCase().includes(query);
    return categoryMatch && queryMatch;
  });
  list.innerHTML = filtered.map((item, index) => `
    <article class="product-item" style="animation-delay: ${index * 55}ms">
      <span class="item-number">${item.number}</span><img class="item-image" src="${item.image || DEFAULT_PRODUCT_IMAGE}" onerror="this.onerror=null;this.src='${DEFAULT_PRODUCT_IMAGE}'" alt="${item.title}" loading="lazy" />
      <div class="item-info"><span class="item-category">${item.category}</span><h3>${item.title}</h3><p>${item.product}</p></div>
      <a class="buy-link" href="${item.link}" target="_blank" rel="noreferrer" aria-label="${item.title} 구매하기"><i data-lucide="arrow-up-right"></i></a>
    </article>`).join('');
  count.textContent = `${String(filtered.length).padStart(2, '0')} ITEMS`;
  emptyState.style.display = filtered.length ? 'none' : 'block';
  if (window.lucide) lucide.createIcons();
}
document.querySelectorAll('.filter').forEach((button) => button.addEventListener('click', () => {
  selectedCategory = button.dataset.filter;
  document.querySelectorAll('.filter').forEach((item) => item.classList.toggle('active', item === button));
  renderProducts();
}));
searchInput.addEventListener('input', renderProducts);
document.querySelector('#clear-search').addEventListener('click', () => { searchInput.value = ''; searchInput.focus(); renderProducts(); });
loadProducts();
if (window.lucide) lucide.createIcons();
