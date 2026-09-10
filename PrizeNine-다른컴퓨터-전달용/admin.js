const storageKey = 'picklog-admin-products';
const form = document.querySelector('#product-form');
const savedList = document.querySelector('#saved-list');
const emptyState = document.querySelector('#empty-state');
const savedCount = document.querySelector('#saved-count');
const formStatus = document.querySelector('#form-status');
const reviewForm = document.querySelector('#review-form');
const reviewResult = document.querySelector('#review-result');
let savedProducts = JSON.parse(localStorage.getItem(storageKey) || '[]');

function renderSavedProducts() {
  savedList.innerHTML = savedProducts.map((item, index) => `
    <div class="saved-item"><span class="saved-number">${item.number}</span><div><strong>${item.title}</strong><small>${item.category} · ${item.product}</small></div><button class="remove-button" type="button" data-index="${index}" aria-label="${item.title} 삭제"><i data-lucide="trash-2"></i></button></div>`).join('');
  savedCount.textContent = `${String(savedProducts.length).padStart(2, '0')} ITEMS`;
  emptyState.style.display = savedProducts.length ? 'none' : 'block';
  if (window.lucide) lucide.createIcons();
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const item = Object.fromEntries(data.entries());
  item.number = String(savedProducts.reduce((max, product) => Math.max(max, Number(product.number) || 0), 0) + 1).padStart(2, '0');
  savedProducts.unshift(item);
  localStorage.setItem(storageKey, JSON.stringify(savedProducts));
  form.reset();
  renderSavedProducts();
  if (formStatus) formStatus.textContent = `제품 ${item.number}번을 접수했습니다. 시트에서는 배열수식 번호를 사용합니다.`;
});

savedList.addEventListener('click', (event) => {
  const button = event.target.closest('.remove-button');
  if (!button) return;
  savedProducts.splice(Number(button.dataset.index), 1);
  localStorage.setItem(storageKey, JSON.stringify(savedProducts));
  renderSavedProducts();
});

reviewForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = new FormData(reviewForm);
  try {
    const reviews = JSON.parse(String(data.get('reviews') || ''));
    if (!Array.isArray(reviews)) throw new Error('리뷰 JSON은 배열이어야 합니다.');
    reviewResult.textContent = '브라우저 세션 리뷰를 분석 중입니다…';
    const response = await fetch('/api/research', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url: data.get('url'), reviews }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || '리뷰 분석에 실패했습니다.');
    const summary = result.analysis;
    reviewResult.textContent = `총 ${summary.total}건 분석\n긍정 ${summary.sentiment.positive} · 부정 ${summary.sentiment.negative} · 혼합 ${summary.sentiment.mixed} · 중립 ${summary.sentiment.neutral}\n\n` + summary.reviews.map((review) => `[${review.sentiment}] ${review.text}`).join('\n');
  } catch (error) { reviewResult.textContent = error instanceof Error ? error.message : '리뷰 JSON을 확인해 주세요.'; }
});

renderSavedProducts();
if (window.lucide) lucide.createIcons();
