Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$root=Split-Path -Parent $PSScriptRoot
$envFile=Join-Path $root '.env.local'
$form=New-Object System.Windows.Forms.Form
$form.Text='PrizeNine Automation Setup';$form.Size=New-Object System.Drawing.Size(560,520);$form.StartPosition='CenterScreen'
$fields=@('TRIGGER_SECRET','GOOGLE_APPS_SCRIPT_URL','NOTIFY_EMAIL','TELEGRAM_BOT_TOKEN','TELEGRAM_CHAT_ID','TOPVIEW_API_KEY');$boxes=@{}
for($i=0;$i -lt $fields.Count;$i++){ $l=New-Object System.Windows.Forms.Label;$l.Text=$fields[$i];$l.Location=New-Object System.Drawing.Point(20,(20+$i*52));$l.AutoSize=$true;$form.Controls.Add($l);$b=New-Object System.Windows.Forms.TextBox;$b.Location=New-Object System.Drawing.Point(190,(16+$i*52));$b.Size=New-Object System.Drawing.Size(330,26);if($fields[$i] -match 'SECRET|TOKEN|KEY'){$b.PasswordChar='*'};$form.Controls.Add($b);$boxes[$fields[$i]]=$b }
$boxes['TRIGGER_SECRET'].Text=[Guid]::NewGuid().ToString('N')
$save=New-Object System.Windows.Forms.Button;$save.Text='Save settings';$save.Location=New-Object System.Drawing.Point(190,340);$save.Size=New-Object System.Drawing.Size(150,38);$save.Add_Click({$lines=@();foreach($key in $fields){$lines+=($key+'='+$boxes[$key].Text)};Set-Content -LiteralPath $envFile -Value $lines -Encoding UTF8;[System.Windows.Forms.MessageBox]::Show('Saved: '+$envFile,'PrizeNine')});$form.Controls.Add($save)
$url=New-Object System.Windows.Forms.TextBox;$url.Location=New-Object System.Drawing.Point(20,410);$url.Size=New-Object System.Drawing.Size(350,26);$form.Controls.Add($url)
$test=New-Object System.Windows.Forms.Button;$test.Text='Run test';$test.Location=New-Object System.Drawing.Point(390,405);$test.Size=New-Object System.Drawing.Size(130,36);$test.Add_Click({try{$body=@{text=$url.Text;source='gui-test'}|ConvertTo-Json;$r=Invoke-WebRequest -UseBasicParsing -Method Post -Uri 'https://prizenine.vercel.app/api/trigger' -Headers @{Authorization=('Bearer '+$boxes['TRIGGER_SECRET'].Text)} -ContentType 'application/json' -Body $body;[System.Windows.Forms.MessageBox]::Show('Success: '+$r.StatusCode,'PrizeNine')}catch{[System.Windows.Forms.MessageBox]::Show('Failed: '+$_.Exception.Message,'PrizeNine')}});$form.Controls.Add($test)
[void]$form.ShowDialog()
