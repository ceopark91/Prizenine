param([switch]$Force)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $root '.env.local'
if ((Test-Path $envFile) -and -not $Force) { throw '.env.local already exists. Re-run with -Force to replace it.' }
Write-Host 'PrizeNine 자동화 설정 (비밀번호 대신 토큰/OAuth 사용)' -ForegroundColor Cyan
function Ask($label, $default='') { $v=Read-Host "$label$(if($default){" [$default]"})"; if(!$v){$v=$default}; return $v }
$trigger = Ask 'TRIGGER_SECRET (긴 임의 문자열)' ([guid]::NewGuid().ToString('N'))
$sheet = Ask 'GOOGLE_APPS_SCRIPT_URL (없으면 공백)'
$email = Ask 'NOTIFY_EMAIL (선택)'
$tgToken = Ask 'TELEGRAM_BOT_TOKEN (선택)'
$tgChat = Ask 'TELEGRAM_CHAT_ID (선택)'
$topview = Ask 'TOPVIEW_API_KEY (연동 시 입력, 선택)'
$lines = @("TRIGGER_SECRET=$trigger", "INGEST_TOKEN=$trigger", "GOOGLE_APPS_SCRIPT_URL=$sheet", "TOPVIEW_API_KEY=$topview", "NOTIFY_EMAIL=$email", "TELEGRAM_BOT_TOKEN=$tgToken", "TELEGRAM_CHAT_ID=$tgChat")
Set-Content -LiteralPath $envFile -Value ($lines -join "`r`n") -Encoding utf8
Write-Host "설정 저장 완료: $envFile" -ForegroundColor Green
Write-Host '주의: 이 파일은 GitHub에 커밋하지 마세요. Vercel에는 같은 키를 Project Settings > Environment Variables에 입력하세요.' -ForegroundColor Yellow
