# 자동화 설정

초보자는 GUI 설정기를 실행하세요.

```powershell
.\scripts\setup-automation-gui.ps1
```

저장 후 테스트하려면:

```powershell
.\scripts\test-trigger.ps1
```

상품 URL을 입력했을 때 `202`와 `queued`가 나오면 트리거가 정상 작동한 것입니다. Vercel 환경변수에도 같은 `TRIGGER_SECRET`을 먼저 등록해야 합니다.

프로젝트 루트에서 PowerShell을 열고 실행합니다.

```powershell
.\scripts\setup-automation.ps1
```

설정을 다시 만들 때만 `-Force`를 사용합니다.

```powershell
.\scripts\setup-automation.ps1 -Force
```

입력 항목은 Vercel 트리거 비밀키, Google Apps Script 웹앱 URL, 이메일/텔레그램 알림 값, Topview API 키입니다. 쇼핑몰 계정 비밀번호는 저장하지 않습니다. 쿠팡·테무·알리의 비공개 로그인이나 CAPTCHA 우회 대신 공식 제휴 링크와 공개 상품 정보만 사용합니다.

로컬 `.env.local`은 `.gitignore`에 포함되어 GitHub에 올라가지 않습니다. Vercel 배포에서는 동일한 키를 Project Settings → Environment Variables에 직접 등록해야 합니다.
