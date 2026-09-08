# 탑뷰 픽 스튜디오 — 구현 계획

## 목표

상품 URL 하나를 등록하면 상품 정보를 정리하고 Topview 영상 제작 작업을 만들며, 완성된 상품을 숫자 코드로 공개 링크 페이지에서 찾고 제휴 링크로 이동할 수 있게 한다.

## 사용자 흐름

1. 운영자가 `/admin`에서 쿠팡·테무·알리 상품 URL을 입력한다.
2. 시스템이 마켓을 판별하고 상품 번호를 자동 발급한다.
3. 운영자가 상품명·대표 이미지·제휴 링크를 확인하거나 보완한다.
4. `영상 만들기`를 누르면 Topview 작업 큐가 생성된다.
5. OAuth가 연결된 로컬 Codex 작업자가 큐의 생성 지시를 받아 Topview에서 9:16 리뷰형 광고를 만든다.
6. 영상 URL과 상태가 상품 레코드에 반영된다.
7. 공개 `/` 페이지에서 숫자 상품 번호를 검색하거나 카드로 들어간다.
8. `/p/{상품번호}`에서 제품 사진·영상·광고 고지를 확인하고 `구매하러 가기`를 누르면 제휴 URL로 이동한다.
9. `/go/{상품번호}`가 클릭을 기록한 뒤 실제 제휴 URL로 302 리다이렉트한다.

## MVP 화면

- `/`: 상품 번호 검색, 최신 상품 카드 목록, 광고·제휴 고지
- `/p/[code]`: 제품 사진, 영상, 핵심 설명, 구매 버튼
- `/admin`: URL/상품명/이미지/제휴 링크 입력, 작업 생성, 상태 목록
- `/go/[code]`: 클릭 기록 후 제휴 링크 리다이렉트
- `/api/products`: 상품 생성·조회
- `/api/jobs`: Topview 작업 생성·상태 갱신

## 데이터 모델

### products

- `id`: 내부 ID
- `code`: 공개 숫자 상품번호, unique
- `marketplace`: `coupang | temu | aliexpress`
- `source_url`: 원본 상품 URL
- `affiliate_url`: 실제 이동할 제휴 URL
- `name`, `description`, `image_url`, `video_url`
- `status`: `draft | queued | generating | ready | failed`
- `disclosure`: 제휴 광고 고지 문구
- `created_at`, `updated_at`

### generation_jobs

- `id`, `product_id`
- `status`: `queued | claimed | running | succeeded | failed`
- `prompt`, `canvas_id`, `task_id`, `result_url`, `error_message`
- `created_at`, `updated_at`

### click_events

- `id`, `product_id`, `created_at`
- 개인정보를 저장하지 않는 최소 클릭 집계만 사용한다.

## Topview 연동 계약

- 공개 사이트가 Topview OAuth 토큰을 직접 보관하지 않는다.
- 로컬 Codex의 인증된 `topview` MCP를 생성 작업 경계로 사용한다.
- 상품 영상은 `ecommerce-product-video` 흐름을 사용한다.
- 기본값: 한국어, 9:16, 15~25초, 정보형 리뷰, CTA 포함.
- 모든 제품 등장 장면은 원본 상품 이미지를 typed input으로 사용한다.
- 첫 유료 생성 전 해당 Codex 작업에서 Topview 승인 모드를 선택한다.
- 성공 결과의 영상 URL만 `video_url`에 기록한다.

## 제휴 링크 규칙

- 일반 상품 URL과 제휴 URL을 분리해 저장한다.
- 자동 변환용 공식 API/인증이 연결되지 않은 마켓은 제휴 URL을 운영자가 보완한다.
- 공개 페이지에는 `제휴 링크를 통한 구매 시 수수료를 받을 수 있습니다`를 명확히 표시한다.
- 가격·할인율·배송일은 자동 고정 문구로 생성하지 않는다.

## 완료 기준

- 숫자 코드 검색이 동작한다.
- 상품 생성 후 카드와 상세 페이지에 즉시 나타난다.
- 구매 버튼이 `/go/{code}`를 거쳐 제휴 URL로 이동한다.
- Topview 작업을 생성하고 상태를 갱신할 수 있다.
- D1 마이그레이션과 프로덕션 빌드가 성공한다.
- 모바일 9:16 영상과 상품 이미지가 보기 좋게 표시된다.

## 2단계 확장

- 쿠팡 파트너스 등 공식 API 기반 제휴 링크 자동 변환
- 상품 페이지 메타데이터 자동 수집
- 영상 A/B 버전 3개 생성
- 조회·클릭·판매 성과 대시보드
- 예약 업로드와 재생성 규칙
