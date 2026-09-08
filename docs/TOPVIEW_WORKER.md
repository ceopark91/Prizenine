# Topview worker 프로토콜

이 웹앱은 Topview 인증정보를 보관하거나 MCP를 직접 호출하지 않는다. 인증된 Codex 작업자가 `/admin`의 WebMCP 도구를 사용해 D1 작업 큐를 처리한다.

## 기본 생성 계약

`POST /api/jobs` 또는 `enqueue_topview_video`는 다음 기본값을 포함한 작업을 만든다.

- `generationMode`: `direct_video`
- `taskType`: 이미지가 있으면 `image_to_video`, 없으면 `text_to_video`
- `aspectRatio`: 이미지가 있으면 `source` 표시이며 image-to-video submit에는 이 필드를 보내지 않는다. 이미지가 없으면 `9:16`
- `duration`: `15`초 고정

15초 초과 또는 다중 장면 구성이 명시적으로 필요한 경우에만 별도 Canvas 모드로 전환한다. 기본 큐 작업에서 작업자가 임의로 Canvas를 선택하지 않는다.

## 처리 순서

1. `list_pending_topview_jobs`를 호출한다. 이 도구는 `queued`, `claimed`, `running` 작업을 합쳐 반환한다. 각 항목에는 `jobId`, `productId`, `code`, `name`, `sourceUrl`, `imageUrl`, `affiliateUrl`, `prompt`, `status`, `taskId`, `canvasId`, `resultUrl`와 생성 기본값이 포함된다.
2. 작업을 가져오기 전에 `update_topview_job({ jobId, status: "claimed" })`를 호출한다. 이미 `claimed` 또는 `running`이면 다른 작업자가 처리 중일 수 있으므로 중복 생성하지 않고 다시 조회한다.
3. Topview MCP에서 board/config/upload/generate/query 순서로 처리한다. 제품 이미지가 있으면 반드시 typed image input으로 업로드하고 `image_to_video`를 사용한다. 이 submit에서는 `aspectRatio`를 보내지 않고 원본 이미지 비율을 따른다. 이미지가 없을 때만 `text_to_video`를 사용하며 `aspectRatio: "9:16"`을 보낸다.
4. Topview가 발급한 `taskId`와 필요 시 `canvasId`를 즉시 `running` PATCH에 보존한다.
5. `taskId`로 상태를 재조회한다. 네트워크 오류나 작업자 재시작 후에는 새 생성 요청을 하지 말고 먼저 저장된 `taskId`/`canvasId`를 사용해 재조회한다.
6. 성공하면 `update_topview_job({ jobId, status: "succeeded", taskId, canvasId, resultUrl })`를 호출한다. `resultUrl`은 필수다.
7. 실패하면 `update_topview_job({ jobId, status: "failed", taskId, canvasId, errorMessage })`를 호출한다.

허용 상태 전이는 `queued → claimed/running/failed`, `claimed → running/failed`, `running → succeeded/failed`다. 동일 상태를 다시 보내는 것은 idempotent하게 허용된다. 성공 PATCH는 연결된 상품의 `video_url`과 상태를 원자적으로 갱신한다.

## 중복 과금 방지

`taskId`가 이미 있으면 새 generate를 호출하지 않는다. 작업자가 중단됐거나 응답을 잃은 경우에도 `list_pending_topview_jobs`로 다시 읽고, 저장된 `taskId`를 query한다. `succeeded`/`failed` 작업은 재생성하지 않고 운영자가 새 작업을 명시적으로 만든 경우에만 다시 큐에 넣는다.
