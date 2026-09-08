const storageKey = 'picklog-admin-products';
const form = document.querySelector('#product-form');
const savedList = document.querySelector('#saved-list');
const emptyState = document.querySelector('#empty-state');
const savedCount = document.querySelector('#saved-count');
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
  savedProducts.unshift(Object.fromEntries(data.entries()));
  localStorage.setItem(storageKey, JSON.stringify(savedProducts));
  form.reset();
  renderSavedProducts();
});

savedList.addEventListener('click', (event) => {
  const button = event.target.closest('.remove-button');
  if (!button) return;
  savedProducts.splice(Number(button.dataset.index), 1);
  localStorage.setItem(storageKey, JSON.stringify(savedProducts));
  renderSavedProducts();
});

renderSavedProducts();
if (window.lucide) lucide.createIcons();