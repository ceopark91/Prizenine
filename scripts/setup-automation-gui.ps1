Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$root=Split-Path -Parent $PSScriptRoot; $file=Join-Path $root '.env.local'
$f=New-Object Windows.Forms.Form; $f.Text='PrizeNine 자동화 설정'; $f.Size=New-Object Drawing.Size(560,520); $f.StartPosition='CenterScreen'
$labels=@('트리거 비밀키','Google Apps Script URL','알림 이메일','Telegram Bot Token','Telegram Chat ID','Topview API Key'); $keys=@('TRIGGER_SECRET','GOOGLE_APPS_SCRIPT_URL','NOTIFY_EMAIL','TELEGRAM_BOT_TOKEN','TELEGRAM_CHAT_ID','TOPVIEW_API_KEY'); $boxes=@{}
for($i=0;$i -lt $labels.Count;$i++){ $l=New-Object Windows.Forms.Label; $l.Text=$labels[$i]; $l.Location=New-Object Drawing.Point(25,(25+$i*55)); $l.AutoSize=$true; $f.Controls.Add($l); $t=New-Object Windows.Forms.TextBox; $t.Location=New-Object Drawing.Point(190,(20+$i*55)); $t.Size=New-Object Drawing.Size(330,28); if($keys[$i] -match 'TOKEN|KEY|SECRET'){$t.PasswordChar='*'}; $f.Controls.Add($t); $boxes[$keys[$i]]=$t }
$boxes['TRIGGER_SECRET'].Text=[guid]::NewGuid().ToString('N')
$save=New-Object Windows.Forms.Button; $save.Text='설정 저장'; $save.Location=New-Object Drawing.Point(190,420); $save.Size=New-Object Drawing.Size(150,40); $save.Add_Click({ $v=@("TRIGGER_SECRET=$($boxes.TRIGGER_SECRET.Text)",'INGEST_TOKEN='+$boxes.TRIGGER_SECRET.Text,"GOOGLE_APPS_SCRIPT_URL=$($boxes.GOOGLE_APPS_SCRIPT_URL.Text)","NOTIFY_EMAIL=$($boxes.NOTIFY_EMAIL.Text)","TELEGRAM_BOT_TOKEN=$($boxes.TELEGRAM_BOT_TOKEN.Text)","TELEGRAM_CHAT_ID=$($boxes.TELEGRAM_CHAT_ID.Text)","TOPVIEW_API_KEY=$($boxes.TOPVIEW_API_KEY.Text)); Set-Content -LiteralPath $file -Value ($v -join "`r`n") -Encoding utf8; [Windows.Forms.MessageBox]::Show("저장 완료`r`n$file",'PrizeNine') }); $f.Controls.Add($save)
$f.ShowDialog() | Out-Null
