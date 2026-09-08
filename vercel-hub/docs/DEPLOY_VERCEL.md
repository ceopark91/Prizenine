# Vercel 운영 배포 체크리스트

이 폴더는 `prizenine.vercel.app`의 소스에 병합한 뒤 배포해야 합니다. 현재 로컬 환경에는 Vercel CLI 로그인과 프로젝트 연결 정보가 없으므로 자동 배포는 수행하지 않습니다.

## 환경변수

Vercel 프로젝트의 Production 환경에 다음 값을 등록합니다.

- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `GOOGLE_SHEET_ID=1b_dNkuhjl2XQbc3JG4dTrjbIyszzkjLs6cP35xaHQFY`
- `GOOGLE_SHEET_NAME=시트1`
- `INGEST_TOKEN`
- `TELEGRAM_WEBHOOK_SECRET`
- `ALERT_EMAIL`

서비스 계정 이메일을 해당 Google Sheet에 편집자로 공유합니다. 개인키와 토큰은 Git에 저장하지 않습니다.

## 배포 후 확인

```bash
curl -i https://prizenine.vercel.app/api/ingest
curl -i -X POST https://prizenine.vercel.app/api/ingest \
  -H "Authorization: Bearer $INGEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"https://example.com/product"}'
```

두 번째 요청은 실제 상품 URL로 테스트하고, 시트의 A열 배열수식 번호·B:F 데이터·`_jobs` 행이 생성되는지 확인합니다. 이후 Topview 작업자를 활성화합니다.
