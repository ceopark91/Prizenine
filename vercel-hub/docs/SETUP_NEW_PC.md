# 새 컴퓨터 설치 및 URL 트리거

## 환경변수

기존 Google Sheets 변수와 함께 다음을 설정합니다.

```env
INGEST_TOKEN=긴-랜덤-문자열
TELEGRAM_WEBHOOK_SECRET=텔레그램-봇-시크릿-문자열
```

`INGEST_TOKEN`은 메일 자동화나 직접 호출용입니다. `TELEGRAM_WEBHOOK_SECRET`은 Telegram이 보내는 `X-Telegram-Bot-Api-Secret-Token` 헤더와 비교됩니다. 두 값은 서로 다른 랜덤 값으로 만들고 저장소에 커밋하지 않습니다.

## URL 수신 API

일반 메일/n8n/자동화 도구는 다음처럼 호출합니다.

```bash
curl -X POST https://prizenine.vercel.app/api/ingest \
  -H "Authorization: Bearer $INGEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"https://www.coupang.com/vp/products/..."}'
```

상품 URL이 이미 시트에 있으면 기존 제품을 반환하고 중복 행을 만들지 않습니다. 새 URL이면 시트에 `queued` 상태로 등록하며, Topview 생성은 별도 작업자가 pending 상품을 읽어 수행합니다.

## Telegram 연결

BotFather에서 발급한 봇 토큰으로 한 번만 실행합니다.

```bash
curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://prizenine.vercel.app/api/telegram/webhook","secret_token":"<TELEGRAM_WEBHOOK_SECRET>"}'
```

텔레그램 메시지에 상품 URL 하나를 보내면 webhook이 URL을 추출해 등록합니다. URL 추출 실패, 잘못된 secret, 중복 URL은 각각 400/401/중복 응답으로 처리됩니다.

## 메일 연결

메일 수신 서비스 또는 n8n에서 메일 본문의 URL을 추출해 `/api/ingest`에 Bearer 토큰으로 전달합니다. 메일 서버 비밀번호나 Telegram 토큰은 이 프로젝트에 저장하지 않습니다.
