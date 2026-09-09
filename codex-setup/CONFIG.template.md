# PrizeNine 설정값

이 파일을 복사해 `CONFIG.local.md`로 만든 뒤 주소와 키를 입력합니다. `CONFIG.local.md`와 `.env.local`은 GitHub에 올리지 않습니다.

```text
GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/배포ID/exec
GOOGLE_FORM_URL=https://docs.google.com/forms/d/e/폼ID/viewform
SHEET_URL=https://docs.google.com/spreadsheets/d/시트ID/edit
TOPVIEW_CANVAS_URL=https://www.topview.ai/canvas/캔버스ID
TOPVIEW_CANVAS_ID=캔버스ID
TOPVIEW_CHARACTER_NAME=명예모델1호
TOPVIEW_CHARACTER_TOKEN=<<@char_1>>
NOTIFY_EMAIL=알림받을이메일
TRIGGER_SECRET=긴-비밀키
INGEST_TOKEN=긴-비밀키
```

상품 이미지를 확보하지 못하면 영상을 만들지 않습니다. 실제 이미지는 반드시 `image_to_video`의 참조 이미지로 사용합니다.
