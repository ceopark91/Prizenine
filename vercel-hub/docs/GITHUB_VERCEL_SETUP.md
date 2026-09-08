# GitHub → Vercel 자동 배포

저장소의 `vercel-hub` 폴더를 GitHub 저장소 루트로 올린 뒤 Vercel 프로젝트의 Root Directory를 `vercel-hub`로 지정하거나, 이 폴더 자체를 별도 저장소로 사용합니다.

GitHub 저장소 Settings → Secrets and variables → Actions에 다음 Secret을 등록합니다.

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Vercel 프로젝트의 Production Environment Variables에는 `.env.example`의 Google Sheets·트리거·알림 값을 등록합니다. 이후 `main`에 push하면 typecheck → build → production deploy가 순서대로 실행됩니다.

Vercel CLI의 `pull`, `build`, `deploy --prebuilt` 흐름을 사용해 로컬 PC가 바뀌어도 동일한 배포 결과를 재현합니다.
