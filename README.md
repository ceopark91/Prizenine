# Prizenine / picklog

리뷰 영상에서 본 제품을 번호와 이름으로 찾아 바로 구매하는 모바일 중심 커미션 링크 허브입니다. PC에서도 모바일 폭의 캔버스로 표시되며, 영상 재생 기능은 포함하지 않습니다.

## 로컬 확인

```bash
npx serve .
```

## Vercel 배포

Vercel에서 이 저장소를 Import하면 됩니다. Framework Preset은 `Other`, Build Command는 비워두고 Output Directory는 `.`으로 설정하세요.

방문자 페이지는 [app.js](app.js)의 `PRODUCT_SHEET_CSV_URL`에 연결된 구글시트 CSV를 자동으로 읽습니다. 현재 연결된 시트는 `1b_dNkuhjl2XQbc3JG4dTrjbIyszzkjLs6cP35xaHQFY`의 `gid=0` 탭이며, 첫 행은 아래 컬럼명을 사용합니다. 상품 이미지가 비어 있거나 이미지 URL이 깨진 경우 [default-product.svg](default-product.svg)가 자동으로 표시됩니다.

```text
제품번호,카테고리,상품명,브랜드/제품설명,쿠팡 구매링크,상품이미지
01,생활,상품명,브랜드 · 제품 설명,https://쿠팡상품주소,https://이미지주소
```

구글시트에서 `파일 > 공유 > 웹에 게시`를 선택하고, 전체 문서를 CSV 형식으로 게시한 URL을 `PRODUCT_SHEET_CSV_URL`에 넣으면 됩니다. URL을 넣지 않으면 샘플 상품이 표시됩니다.

## 관리자 화면

관리자 작업 주소는 `/admin.html`입니다. 실제 데이터는 구글시트에서 관리하며, 관리자 페이지의 입력 폼은 현재 미리보기용입니다. 여러 기기에서 공유되는 쓰기 기능과 비공개 접근 제어를 사용하려면 Google Apps Script 또는 인증 가능한 백엔드를 추가해야 합니다.