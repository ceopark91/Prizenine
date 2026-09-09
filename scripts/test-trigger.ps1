$envFile=Join-Path (Split-Path -Parent $PSScriptRoot) '.env.local'
if(!(Test-Path $envFile)){throw '먼저 setup-automation-gui.ps1을 실행하세요.'}
Get-Content $envFile | ForEach-Object { if($_ -match '^([^#][^=]*)=(.*)$'){ Set-Variable -Name $matches[1] -Value $matches[2] } }
$url=Read-Host '테스트할 상품 URL (https://...)'
$body=@{text=$url;source='manual-test'} | ConvertTo-Json
try { $r=Invoke-WebRequest -UseBasicParsing -Method Post -Uri 'https://prizenine.vercel.app/api/trigger' -Headers @{Authorization="Bearer $TRIGGER_SECRET"} -ContentType 'application/json' -Body $body; Write-Host "성공 ($($r.StatusCode))" -ForegroundColor Green; $r.Content } catch { Write-Host "실패: $($_.Exception.Message)" -ForegroundColor Red; if($_.Exception.Response){(New-Object IO.StreamReader($_.Exception.Response.GetResponseStream())).ReadToEnd()} }
