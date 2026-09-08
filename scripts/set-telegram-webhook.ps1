param(
  [Parameter(Mandatory = $true)] [string]$BotToken,
  [Parameter(Mandatory = $true)] [string]$WebhookUrl,
  [Parameter(Mandatory = $true)] [string]$SecretToken
)

$payload = @{ url = $WebhookUrl; secret_token = $SecretToken } | ConvertTo-Json -Compress
$endpoint = "https://api.telegram.org/bot$BotToken/setWebhook"
$response = Invoke-RestMethod -Method Post -Uri $endpoint -ContentType 'application/json' -Body $payload
if (-not $response.ok) { throw "Telegram webhook 설정 실패" }
$response | ConvertTo-Json -Depth 5
