# PrizeNine 자동화 운영 계약

이 파일과 `job-stage-contract.mjs`, `validate-conti.mjs`는 모든 PC·모든 Codex 채팅에서 공통으로 쓰는 실행 기준이다. 대시보드 문구나 과거 작업 로그는 이 계약을 대체하지 못한다.

## 단일 기준과 종료 규칙

- 운영 큐의 단일 기준은 Supabase `jobs`, `products`, `recommendation_requests`다. 스프레드시트는 운영 체크포인트가 아니다.
- 모든 비종료 job은 `requiredActionForJob()`이 반환하는 한 가지 다음 행동을 가져야 한다. “상태 변화 없음”은 실행 가능한 job의 결과가 될 수 없다.
- `VIDEO_SUBMIT_FAILED`는 Topview가 실제 submit 후 taskId/submissionId와 함께 반환한 최종 오류일 때만 쓴다. 현재 채팅에만 있는 MCP 인증, Canvas 미디어 준비 부족, 워커의 기능 부재는 실패 원인이 아니다.
- `REVIEW_APPROVED` 순서: 콘티 품질 통과 → 채팅의 인증된 Topview MCP로 Canvas·영속 미디어 준비 → 라이브 capability 기반 계획 고정 → 실제 taskId/nodeId/submissionId 저장 → 결과 폴링·완료 또는 실제 제공자 실패 기록.
- detached `codex exec` 워커는 chat-bound Topview MCP와 Computer Use를 호출하지 못할 수 있다. 이 경우 `CHAT_TOPVIEW_MCP_REQUIRED` 또는 `CHAT_BROWSER_RESEARCH_REQUIRED`를 반환하고 상태를 보존한다. 예약된 이 채팅의 heartbeat가 직접 해당 단계를 수행한다.
- 모든 Supabase 변경은 revision 조건부 저장 후 재조회한다. 충돌 시 같은 작업만 다시 판정하며 다른 job을 임의로 고르지 않는다.

## 제품 확인 및 번호 불변식

- 쿠팡은 현재 Codex 채팅의 Computer Use 또는 승인된 BrowserAct 렌더 화면으로만 확인한다. HTTP 크롤러·프록시·stealth 우회·추정 데이터는 쓰지 않는다.
- `product_number`는 PrizeNine 내부 카탈로그 번호다. `products`의 최대 정상 번호 다음 순번만 사용하며 쿠팡 productId/itemId/vendorItemId/URL 숫자는 절대 내부 번호로 쓰지 않는다.
- `RECEIVED`는 제품명·선택 옵션·규격·1~3개의 검증된 판매자 이미지·동일 옵션 후기 본문 2건 이상을 저장하고 재조회한 뒤에만 `DIGGING_DONE`으로 진행한다.
- 쿠팡 화면이 늦게 뜨면 두 번 기다려 재시도한다. 화면에 이미지가 있는데 접근성 트리에 URL이 없다는 이유만으로 `검증 불가`로 끝내지 않는다.

## 추천 제품 요청

- `recommendation_requests.pending`은 독립 실행 큐다. 성공하면 중복 검사를 통과한 실제 쿠팡 상품을 `jobs.RECEIVED`로 이관하고 요청을 완료로 한다.
- 후보 선정은 현재 채팅의 정상 브라우저에서 공개 웹/시장성/계절성/경쟁도/영상 적합성을 먼저 분석한다. 최근 products와 jobs의 상품번호·제목·세부 카테고리를 비교해 중복과 최근 추천군 반복을 막고, 최종 후보 하나만 쿠팡 렌더 페이지로 검증한다. detached worker는 BrowserAct core, stealth 추출, 프록시 모드를 호출하지 않는다.

## 콘티 품질 게이트

`validate-conti.mjs`를 통과하지 못한 콘티는 자동 승인·Topview 제출 금지다.

- 28~40초, 연속된 6~8개 장면.
- 역할 순서: 문제 훅 → 제품 첫인상 → 실제 다각도 → 동일 옵션 후기 기반 사용 맥락 → 솔직한 구매 전 확인 → 내부 상품번호 CTA.
- 모든 장면은 카메라·구체 화면 묘사·나레이션·자막 스타일/위치/안전영역·전환을 가진다. 제품 외형·색상·구성품·크기를 만들거나 과장하지 않는다.
- 후기 본문은 날짜·선택 옵션·짧은 근거가 있는 동일 옵션 2건 이상만 쓴다. 장점만 말하지 말고 실제 단점·확인 항목 하나를 영상에 포함한다.
- 모델1호는 사용자 승인 기준 이미지가 있을 때 도입과 CTA에만 사용하고, 본편은 실제 판매자 제품 사진·디테일 중심으로 구성한다.
- CTA는 `프로필 링크`와 PrizeNine 내부 상품번호를 음성·자막에 모두 사용한다.

## Topview 제출 규칙

- 항상 `get_topview_canvas_generation_capabilities`를 먼저 읽고 MCP가 반환한 preferred 모델·기본값·capabilityVersion·입력 역할로 계획을 고정한다.
- 실제 제품과 모델 기준 이미지는 Canvas의 영속 media node에서 typed input으로 전달한다. URL·file node·추측 nodeId는 입력으로 쓰지 않는다.
- 30초를 넘는 영상은 capability 출력 한도에 맞춰 균등 분할한다. scene 수와 generation task 수를 같은 것으로 취급하지 않는다.
- 렌더가 실패하면 taskId, nodeId, Topview 오류 원문을 남기고 실패로 종결한다. 크레딧 부족은 재시도 가능 실패다. taskId 없이 실패시키지 않는다.

## 토큰 절약과 모델 라우팅

- Luna Light가 큐 판정·Computer Use·BrowserAct 증거 수집·콘티 작성·상태 폴링을 담당한다. 전체 페이지/후기 전문/저장소를 덤프하지 말고 필요한 DOM과 같은 옵션의 짧은 후기만 읽는다.
- `browseract-evidence-protocol.md`와 `conti-quality-template.json`만 해당 단계에 읽는다. 다음 작업을 위해 과거 로그를 광범위하게 탐색하지 않는다.
