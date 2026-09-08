# Prizenine / picklog

쿠팡 상품 리뷰 영상을 모아 보여주는 링크 허브의 첫 화면입니다. 현재는 정적 HTML/CSS/JS로 구성되어 Vercel에 별도 빌드 설정 없이 배포할 수 있습니다.

## 로컬 확인

```bash
npx serve .
```

## Vercel 배포

Vercel에서 이 저장소를 Import하면 됩니다. Framework Preset은 `Other`, Build Command는 비워두고 Output Directory는 `.`으로 설정하세요.

`app.js` 상단의 `products` 배열에 구글 시트 또는 TopView AI 연동 결과를 연결하면 영상 번호, 상품명, 구매 링크를 자동으로 렌더링할 수 있습니다.