# PrizeNine 다른 컴퓨터 전달용 폴더

처음에는 `codex-setup/다른컴퓨터-처음부터-끝까지.md`만 읽으세요.

가장 빠른 순서:

1. Codex 설치·로그인
2. Topview MCP 설치 및 OAuth 로그인
3. `docs/google-apps-script.gs`를 Google Sheets Apps Script에 붙여넣고 웹앱 배포
4. `codex-setup/사용자-설정만-수정.md`를 `CONFIG.local.md`로 저장하고 본인 주소 입력
5. `codex-setup/START-HERE.bat` 더블클릭

## GitHub·Vercel 커머스 사이트

이 폴더의 `index.html`, `app.js`, `styles.css`, `api/`, `vercel.json`이 상품 검색·제품번호 조회·파트너 링크 이동을 담당합니다. 이 폴더 전체를 GitHub 저장소에 올린 뒤 Vercel에서 해당 저장소를 Import해 배포합니다.

Vercel 환경변수에는 사용자 Apps Script 주소를 입력합니다.

```text
GOOGLE_APPS_SCRIPT_URL=사용자_Apps_Script_exec_주소
```

사이트에서 제품번호를 검색하면 Google Sheet에서 읽은 상품명·이미지·커머스 링크를 표시합니다. 쿠팡·기타 제휴 링크는 Sheet의 링크 값을 그대로 사용합니다.

이 폴더에는 비밀키와 실제 계정 정보가 들어 있지 않습니다. 사용자별 설정만 입력하면 됩니다.
