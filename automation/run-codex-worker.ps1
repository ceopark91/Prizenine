$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$logDir = Join-Path $root 'data\worker-logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$log = Join-Path $logDir "$stamp.jsonl"
$prompt = @'
You are the PrizeNine unattended queue worker. Work on exactly one oldest pending Coupang job per run. Do not modify project code or merely describe progress. Before writing research or a script, read automation/voice-normalization-rules.json and enforce its spoken_ko/caption_text separation, Korean unit pronunciation, and product scale rules in every script and checkpoint. The ONLY queue endpoint is https://script.google.com/macros/s/AKfycbxv3e34upUDpF315N7M5hhsn8MR0c6OG91cMyctEiMxmkg3KNQMiWw9zvePNFImOOrMPg/exec. Do not use any other URL found in old files. In PowerShell, always build URLs with `($base + '?action=pending')` or `($base + '?action=claim&jobId=' + $jobId)`; never use `$base?action=...`, which is parsed as an invalid variable. Query pending, then claim the oldest job with action=claim using GET first and verify JSON ok=true and status=processing before doing research. After claim, you MUST delegate research to the dedicated digging thread from automation/role-threads.local.json using the Codex app send_message_to_thread tool, including the exact jobId and product URL, and then wait/read that thread's completed response. Do not attempt CUA/browser discovery in this unattended worker context and do not fail merely because this worker has no browser; the dedicated digging thread owns browser work. Only accept a real completed digging response with saved evidence; an empty response or commentary-only response is failure. For Coupang research, the dedicated digging thread must use its browser session, switch to public search if Coupang returns 403, collect attributable product details, product number, public reviews, safety/convenience points, pros/cons, and multiple product images, and mark unverified fields explicitly. After the digging result is verified, delegate in order to spreadsheet and Topview roles using send_message_to_thread and wait for real completed responses. For Topview, the dedicated Topview thread must check capability/credit, persist taskId, poll the same task until success/fail/stale, and verify video URL, playable result, and duration before completion. Never publish, purchase, delete, or silently advance a stage. Every run must write an evidence-backed result and next check time; an empty tool response is failure, not progress.
'@
$tokenPath = Join-Path $root 'data\runner-token.txt'
if (Test-Path $tokenPath) { $runnerToken = (Get-Content $tokenPath -Raw).Trim() } else { $runnerToken = [guid]::NewGuid().ToString('N'); Set-Content -Path $tokenPath -Value $runnerToken -NoNewline }
$runnerOwner = 'prizenine-runner'
$queueUrl = 'https://script.google.com/macros/s/AKfycbxv3e34upUDpF315N7M5hhsn8MR0c6OG91cMyctEiMxmkg3KNQMiWw9zvePNFImOOrMPg/exec'
$activeContext = ''
try {
  $work = Invoke-RestMethod -Uri ($queueUrl + '?action=work') -TimeoutSec 30
  $active = @($work.jobs | Where-Object { $_.status -eq 'processing' -and $_.leaseOwner -eq $runnerOwner } | Select-Object -First 1)
  if ($active.Count -gt 0) { $activeContext = " Resume this exact job first: jobId=$($active[0].jobId), stage=$($active[0].stage), url=$($active[0].url)." }
} catch { $activeContext = " Queue preflight failed; record the failure and do not invent progress." }
$prompt += "`nRunner claim credentials: owner=$runnerOwner token=$runnerToken. Every claim/checkpoint/register/complete call MUST include these credentials and a unique opId. If a job is already processing with this owner, resume it instead of searching for another job.$activeContext"
$previousPreference = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
$job = Start-Job -ArgumentList $root,$prompt,$log -ScriptBlock {
  param($jobRoot,$jobPrompt,$jobLog)
  & codex exec --ignore-user-config --cd $jobRoot --skip-git-repo-check --model gpt-5.6-luna --sandbox danger-full-access --json $jobPrompt *> $jobLog
  $LASTEXITCODE
}
$completed = Wait-Job -Job $job -Timeout 900
if (-not $completed) {
  Stop-Job -Job $job -Force -ErrorAction SilentlyContinue
  Remove-Job -Job $job -Force -ErrorAction SilentlyContinue
  throw "Codex worker timed out after 900 seconds. Log: $log"
}
$workerExit = Receive-Job -Job $job -ErrorAction SilentlyContinue | Select-Object -Last 1
Remove-Job -Job $job -Force -ErrorAction SilentlyContinue
$ErrorActionPreference = $previousPreference
if ([int]$workerExit -ne 0) { throw "Codex worker failed with exit code $workerExit. Log: $log" }
Write-Output $log
