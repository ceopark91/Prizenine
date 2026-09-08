# 링크 자동 실행 트리거

Vercel 배포 주소의 `POST /api/trigger`로 상품 URL을 보내면 기존 ingest 큐와 동일하게 처리됩니다.

필수 환경변수:

- `TRIGGER_SECRET` (없으면 `INGEST_TOKEN` 사용)
- `GOOGLE_APPS_SCRIPT_URL` (설정 시 조사된 상품 필드와 URL을 시트 Apps Script로 전달; 예제는 `google-apps-script.gs`)

인증 헤더: `Authorization: Bearer <TRIGGER_SECRET>`, `X-Trigger-Secret`, 또는 Telegram webhook의 `X-Telegram-Bot-Api-Secret-Token`.

Telegram 직접 연결 예시: `https://api.telegram.org/bot<BOT_TOKEN>/setWebhook`에 POST하고, JSON에 `url: "https://prizenine.vercel.app/api/trigger"`, `secret_token: "<TRIGGER_SECRET>"`를 지정하세요. 텔레그램 메시지의 `message.text`에서 URL을 자동 추출합니다.

간단한 테스트:

```bash
curl -X POST https://prizenine.vercel.app/api/trigger \
  -H "Authorization: Bearer $TRIGGER_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"text":"https://example.com/product","source":"test"}'
```

텔레그램 BotFather에서 webhook을 연결할 때는 중계 서버에서 받은 메시지 텍스트를 `text` 필드로 전달하고 `X-Trigger-Secret`을 붙입니다. 이메일은 Resend/Postmark 등 inbound webhook에서 본문을 `body` 또는 `text`로 전달하면 됩니다. 모든 입력은 URL 하나를 추출하고, 비공개 페이지 로그인 우회나 무단 크롤링은 하지 않습니다.

n8n 사용자는 `automation/n8n-prizenine-trigger.json`을 Import한 뒤 `PRIZENINE_TRIGGER_SECRET` 환경변수를 설정하고, 이메일/텔레그램 노드를 Webhook 노드 앞에 연결하면 됩니다. n8n은 여러 컴퓨터에서 같은 JSON을 재사용할 수 있습니다.

등록 완료 알림은 Apps Script 프로젝트 설정의 Script properties에 `NOTIFY_EMAIL`을 설정하면 이메일로, `TELEGRAM_BOT_TOKEN`과 `TELEGRAM_CHAT_ID`를 설정하면 텔레그램으로 받을 수 있습니다.
