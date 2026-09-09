Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$root=Split-Path -Parent $PSScriptRoot
$envFile=Join-Path $root '.env.local'
$form=New-Object System.Windows.Forms.Form
$form.Text='PrizeNine 자동화 설정';$form.Size=New-Object System.Drawing.Size(560,520);$form.StartPosition='CenterScreen';$form.BackColor=[System.Drawing.Color]::White
$title=New-Object System.Windows.Forms.Label;$title.Text='상품 링크 자동화 센터';$title.Font=New-Object System.Drawing.Font('맑은 고딕',16,[System.Drawing.FontStyle]::Bold);$title.ForeColor=[System.Drawing.Color]::FromArgb(30,70,140);$title.Location=New-Object System.Drawing.Point(20,15);$title.AutoSize=$true;$form.Controls.Add($title)
$fields=@("TRIGGER_SECRET","GOOGLE_APPS_SCRIPT_URL","NOTIFY_EMAIL","TELEGRAM_BOT_TOKEN","TELEGRAM_CHAT_ID","TOPVIEW_API_KEY");$names=@("트리거 비밀키","Google 시트 연결주소","알림 받을 이메일","텔레그램 봇 토큰","텔레그램 채팅 ID","Topview API 키");$boxes=@{}
for($i=0;$i -lt $fields.Count;$i++){ $l=New-Object System.Windows.Forms.Label;$l.Text=$names[$i];$l.Font=New-Object System.Drawing.Font('맑은 고딕',10);$l.Location=New-Object System.Drawing.Point(20,(65+$i*42));$l.AutoSize=$true;$form.Controls.Add($l);$b=New-Object System.Windows.Forms.TextBox;$b.Location=New-Object System.Drawing.Point(190,(61+$i*42));$b.Size=New-Object System.Drawing.Size(330,26);if($fields[$i] -match 'SECRET|TOKEN|KEY'){$b.PasswordChar='*'};$form.Controls.Add($b);$boxes[$fields[$i]]=$b }
$boxes['TRIGGER_SECRET'].Text=''
if(Test-Path $envFile){$old=Get-Content $envFile | Where-Object {$_ -like 'TRIGGER_SECRET=*'} | Select-Object -First 1;if($old){$boxes['TRIGGER_SECRET'].Text=$old.Substring(15)}}
if(Test-Path $envFile){foreach($line in (Get-Content $envFile)){if($line -match '^([^=]+)=(.*)$' -and $boxes.ContainsKey($matches[1])){$boxes[$matches[1]].Text=$matches[2]}}}
$save=New-Object System.Windows.Forms.Button;$save.Text='설정 저장';$save.BackColor=[System.Drawing.Color]::FromArgb(35,110,200);$save.ForeColor=[System.Drawing.Color]::White;$save.Location=New-Object System.Drawing.Point(190,335);$save.Size=New-Object System.Drawing.Size(150,38);$save.Add_Click({$lines=@();foreach($key in $fields){$lines+=($key+'='+$boxes[$key].Text)};Set-Content -LiteralPath $envFile -Value $lines -Encoding UTF8;[System.Windows.Forms.MessageBox]::Show('설정이 저장되었습니다.','PrizeNine')});$form.Controls.Add($save)
$url=New-Object System.Windows.Forms.TextBox;$url.Location=New-Object System.Drawing.Point(20,410);$url.Size=New-Object System.Drawing.Size(350,26);$form.Controls.Add($url)
$test=New-Object System.Windows.Forms.Button;$test.Text='테스트 실행';$test.Location=New-Object System.Drawing.Point(390,405);$test.Size=New-Object System.Drawing.Size(130,36);$test.Add_Click({try{$body=@{text=$url.Text;source='gui-test'}|ConvertTo-Json;$r=Invoke-WebRequest -UseBasicParsing -Method Post -Uri 'https://prizenine.vercel.app/api/public-trigger' -ContentType 'application/json' -Body $body;[System.Windows.Forms.MessageBox]::Show('테스트 성공: '+$r.StatusCode,'PrizeNine')}catch{[System.Windows.Forms.MessageBox]::Show('테스트 실패: '+$_.Exception.Message,'PrizeNine')}});$form.Controls.Add($test)
[void]$form.ShowDialog()
