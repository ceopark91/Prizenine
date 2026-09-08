# Prizenine / picklog

리뷰 영상에서 본 제품을 번호와 이름으로 찾아 바로 구매하는 모바일 중심 커미션 링크 허브입니다. PC에서도 모바일 폭의 캔버스로 표시되며, 영상 재생 기능은 포함하지 않습니다.

## 로컬 확인

```bash
npx serve .
```

## Vercel 배포

Vercel에서 이 저장소를 Import하면 됩니다. Framework Preset은 `Other`, Build Command는 비워두고 Output Directory는 `.`으로 설정하세요.

`app.js` 상단의 `products` 배열에 구글 시트 연동 결과를 연결하면 제품 번호, 상품명, 카테고리, 구매 링크를 자동으로 렌더링할 수 있습니다.

## 관리자 화면

관리자 작업 주소는 `/admin.html`입니다. 현재 입력값은 브라우저 `localStorage`에만 저장되는 화면 프로토타입입니다. 여러 기기에서 공유되는 실제 관리자 기능과 비공개 접근 제어를 사용하려면 인증 가능한 백엔드 또는 Vercel Authentication을 추가해야 합니다.