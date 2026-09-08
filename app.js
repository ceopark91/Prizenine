const products = [
  { number: '01', category: '생활', title: '아침을 바꾸는 작은 조명', product: '무드등 · 오늘의집', image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=700&q=85', link: 'https://www.coupang.com/', tone: 'acid' },
  { number: '02', category: '테크', title: '책상 위, 가장 예쁜 소리', product: '블루투스 스피커 · JBL', image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=700&q=85', link: 'https://www.coupang.com/' },
  { number: '03', category: '뷰티', title: '매일 쓰는 것의 기준', product: '선크림 · Beauty of Joseon', image: 'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=700&q=85', link: 'https://www.coupang.com/' },
  { number: '04', category: '생활', title: '정리의 시작은 여기서', product: '모듈 수납함 · String', image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=700&q=85', link: 'https://www.coupang.com/' },
  { number: '05', category: '테크', title: '퇴근 후 한 장의 온도', product: '필름 카메라 · Kodak', image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=700&q=85', link: 'https://www.coupang.com/' },
  { number: '06', category: '뷰티', title: '향으로 기억되는 하루', product: '오 드 퍼퓸 · Tamburins', image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=700&q=85', link: 'https://www.coupang.com/' }
];

const grid = document.querySelector('#video-grid');
const emptyState = document.querySelector('#empty-state');
const searchInput = document.querySelector('#search-input');
let selectedCategory = '전체';

function renderProducts() {
  const query = searchInput.value.trim().toLowerCase();
  const filtered = products.filter((item) => {
    const matchesCategory = selectedCategory === '전체' || item.category === selectedCategory;
    const matchesQuery = `${item.title} ${item.product}`.toLowerCase().includes(query);
    return matchesCategory && matchesQuery;
  });
  grid.innerHTML = filtered.map((item, index) => `
    <article class="video-card" style="animation-delay: ${index * 60}ms">
      <div class="video-cover">
        <img src="${item.image}" alt="${item.title}" loading="lazy" />
        <span class="video-number">${item.number} / 24</span>
        <span class="video-category">${item.category}</span>
        <button class="play-button" type="button" aria-label="${item.title} 영상 재생" data-title="${item.title}"><i data-lucide="play"></i></button>
      </div>
      <div class="video-meta">
        <div><h3>${item.title}</h3><p>${item.product}</p></div>
        <a class="buy-link" href="${item.link}" target="_blank" rel="noreferrer">구매하기 <i data-lucide="arrow-up-right"></i></a>
      </div>
    </article>`).join('');
  emptyState.style.display = filtered.length ? 'none' : 'block';
  if (window.lucide) lucide.createIcons();
}

document.querySelectorAll('.filter').forEach((button) => {
  button.addEventListener('click', () => {
    selectedCategory = button.dataset.filter;
    document.querySelectorAll('.filter').forEach((item) => item.classList.toggle('active', item === button));
    renderProducts();
  });
});

searchInput.addEventListener('input', renderProducts);
document.querySelector('#search-toggle').addEventListener('click', () => searchInput.focus());
grid.addEventListener('click', (event) => {
  const playButton = event.target.closest('.play-button');
  if (playButton) window.alert(`“${playButton.dataset.title}” 영상은 TopView AI 연동 후 재생됩니다.`);
});

renderProducts();
if (window.lucide) lucide.createIcons();