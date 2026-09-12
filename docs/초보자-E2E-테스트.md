# PrizeNine 전체 흐름 테스트

## 테스트 전 조건

- PC 전원을 켜고 Chrome에서 쿠팡에 로그인한다.
- Codex 작업 PC의 자동화 러너를 실행한다.
- Google Apps Script 배포가 최신 버전인지 확인한다.
- 영상 테스트 비용이 발생할 수 있으므로 실제 테스트 상품 1개만 사용한다.

## 테스트 순서

1. PrizeNine 대시보드에서 쿠팡 상품 URL을 입력하고 `제품 접수`를 누른다.
2. 목록에 작업이 `pending` 또는 `RECEIVED`로 나타나는지 확인한다.
3. 상품 분석이 끝나면 해당 행의 `검수`를 누른다.
4. 이미지 URL과 AI 콘티가 채워졌는지 확인한다.
5. 이미지 1개 또는 콘티 문장 1개를 수정하고 `수정 저장`을 누른다.
6. 다시 검수창을 열어 수정 내용이 보존됐는지 확인한다.
7. `검수 완료 · 제작 요청`을 누른다.
8. 상태가 `REVIEW_APPROVED`에서 `VIDEO_SUBMITTING`, `VIDEO_GENERATING`으로 진행되는지 확인한다.
9. 영상 검증이 끝나면 상태가 `VIDEO_READY`와 `완료`가 되고 영상 링크가 표시되는지 확인한다.
10. Google Sheets의 상품번호·상품 URL·이미지·콘티·영상 링크가 동일한 작업으로 기록됐는지 확인한다.

## 실패 시 확인할 항목

- `GS 연결에 실패`: Apps Script 웹앱 배포 URL 또는 액세스 권한 확인
- `JOB_NOT_FOUND`: 대시보드가 같은 Apps Script 배포를 사용하지 않는 상태
- `REVIEW_SAVED` 후 내용이 사라짐: Apps Script 최신 버전 재배포 확인
- `VIDEO_SUBMITTING`에서 멈춤: 영상 워커와 Topview 로그인 세션 확인
- `VIDEO_READY`가 아닌데 완료 처리됨: 영상 검증 게이트를 통과하지 못한 것이므로 재요청하지 말고 오류 내용을 먼저 확인
