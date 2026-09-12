$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$logDir = Join-Path $root 'data\worker-logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$log = Join-Path $logDir "$stamp.jsonl"
$prompt = @'
You are the PrizeNine unattended queue worker. Process only the exact job and stage appended below, advance at most one verified stage, then stop.

Token discipline is mandatory:
- Any computer-use/browser clicking or page reading is Luna work. Never route computer-use to Sol.
- Do not inventory or search the repository. Do not run rg --files, git log, or broad recursive reads.
- Read only automation/voice-normalization-rules.json plus a single stage-relevant script when strictly necessary.
- Do not inspect old logs, docs, worktrees, screenshots, or unrelated jobs.
- Use the queue API and the supplied job context as the source of truth.

The only queue endpoint is https://script.google.com/macros/s/AKfycbxv3e34upUDpF315N7M5hhsn8MR0c6OG91cMyctEiMxmkg3KNQMiWw9zvePNFImOOrMPg/exec. Claim a pending job or resume this owner's processing job. Every mutating call must include owner, token, unique opId, and current revision. Never patch heartbeat directly; send patch only with allowed stage data and provide actionTaken/result so the server writes heartbeat. If verified evidence is unavailable, record the precise blocker without inventing fields.

Stage policy:
- RECEIVED: collect product identity, specs, reviews, and multiple attributable images; save evidence; advance to DIGGING_DONE only when verified.
- DIGGING_DONE: sync verified research to the spreadsheet/checkpoint; advance to SHEET_DONE.
- SHEET_DONE: write the full Korean conti/script using the voice, unit-pronunciation, and realistic product-scale rules; advance to SCRIPT_READY.
- SCRIPT_READY without review.approvedAt: never submit; stop and wait for the dashboard production request.
- REVIEW_APPROVED: submit to Topview exactly once and persist taskId.
- VIDEO_SUBMITTING and later: poll the existing Topview task and verify playable video URL and duration before completion.

If Coupang returns 403, use an already available authenticated browser/research helper. Do not waste tokens retrying public search more than once. If no authenticated browser helper exists, checkpoint that exact blocker and stop. Never publish, purchase, delete, or silently advance a stage.
'@
$tokenPath = Join-Path $root 'data\runner-token.txt'
if (Test-Path $tokenPath) { $runnerToken = (Get-Content $tokenPath -Raw).Trim() } else { $runnerToken = [guid]::NewGuid().ToString('N'); Set-Content -Path $tokenPath -Value $runnerToken -NoNewline }
$runnerOwner = 'prizenine-runner'
$queueUrl = 'https://script.google.com/macros/s/AKfycbxv3e34upUDpF315N7M5hhsn8MR0c6OG91cMyctEiMxmkg3KNQMiWw9zvePNFImOOrMPg/exec'
$activeContext = ''
$selectedStage = 'RECEIVED'
$hasWork = $false
$reviewApproved = $false
try {
  $work = Invoke-RestMethod -Uri ($queueUrl + '?action=work') -TimeoutSec 30
  $active = @($work.jobs | Where-Object { $_.status -eq 'processing' -and $_.leaseOwner -eq $runnerOwner } | Select-Object -First 1)
  if ($active.Count -eq 0) { $active = @($work.jobs | Where-Object { $_.status -eq 'pending' } | Select-Object -First 1) }
  if ($active.Count -gt 0) {
    $hasWork = $true
    $selectedStage = [string]$active[0].stage
    $reviewApproved = -not [string]::IsNullOrWhiteSpace([string]$active[0].review.approvedAt)
    $activeContext = " Work on this exact job only: jobId=$($active[0].jobId), stage=$selectedStage, url=$($active[0].url)."
  }
} catch { $activeContext = " Queue preflight failed; record the failure and do not invent progress." }
if (-not $hasWork) { Write-Output 'NO_WORK'; exit 0 }
if ($selectedStage -eq 'SCRIPT_READY' -and -not $reviewApproved) {
  Write-Output ("WAITING_FOR_REVIEW jobId=" + $active[0].jobId)
  exit 0
}
$routingPath = Join-Path $PSScriptRoot 'model-routing.json'
$routing = Get-Content -LiteralPath $routingPath -Raw | ConvertFrom-Json
$workerModel = [string]$routing.defaultModel
$routeProperty = $routing.routes.PSObject.Properties[$selectedStage]
if ($null -ne $routeProperty) { $workerModel = [string]$routeProperty.Value }
$reasoningEffort = [string]$routing.defaultReasoningEffort
$effortProperty = $routing.reasoningEffortByStage.PSObject.Properties[$selectedStage]
if ($null -ne $effortProperty) { $reasoningEffort = [string]$effortProperty.Value }
$prompt += "`nAdvance exactly one verified pipeline stage per run, then stop. Model routing is mandatory: Luna Light handles queue, research, sheet, computer-use, and provider-status work; Terra Light handles only SHEET_DONE to SCRIPT_READY conti/script writing. This run uses $workerModel with low reasoning effort for stage $selectedStage. Runner claim credentials: owner=$runnerOwner token=$runnerToken. Every claim/checkpoint/register/complete call MUST include these credentials and a unique opId. If a job is already processing with this owner, resume it instead of searching for another job.$activeContext"
Push-Location $root
try {
  $promptFile = Join-Path $logDir "$stamp.prompt.txt"
  Set-Content -LiteralPath $promptFile -Value $prompt -Encoding UTF8
  $codexPath = (Get-Command codex -ErrorAction Stop).Source
  $cmd = '"' + $codexPath + '" exec --ignore-user-config --cd "' + $root + '" --skip-git-repo-check --model ' + $workerModel + ' --config model_reasoning_effort=' + $reasoningEffort + ' --sandbox danger-full-access --json - < "' + $promptFile + '" > "' + $log + '" 2>&1'
  cmd.exe /d /c $cmd
  $workerExit = $LASTEXITCODE
} finally {
  Pop-Location
}
if ([int]$workerExit -ne 0) { throw "Codex worker failed with exit code $workerExit. Log: $log" }
Write-Output $log
