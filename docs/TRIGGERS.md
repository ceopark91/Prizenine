# 링크 자동 실행 트리거

Vercel 배포 주소의 `POST /api/trigger`로 상품 URL을 보내면 기존 ingest 큐와 동일하게 처리됩니다.

필수 환경변수:

- `TRIGGER_SECRET` (없으면 `INGEST_TOKEN` 사용)
- `GOOGLE_APPS_SCRIPT_URL` (설정 시 조사된 상품 필드와 URL을 시트 Apps Script로 전달; 예제는 `google-apps-script.gs`)

인증 헤더: `Authorization: Bearer <TRIGGER_SECRET>` 또는 `X-Trigger-Secret`.

텔레그램 BotFather에서 webhook을 연결할 때는 중계 서버에서 받은 메시지 텍스트를 `text` 필드로 전달하고 `X-Trigger-Secret`을 붙입니다. 이메일은 Resend/Postmark 등 inbound webhook에서 본문을 `body` 또는 `text`로 전달하면 됩니다. 모든 입력은 URL 하나를 추출하고, 비공개 페이지 로그인 우회나 무단 크롤링은 하지 않습니다.
