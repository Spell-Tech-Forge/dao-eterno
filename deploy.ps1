# deploy.ps1 — Build + ngrok para Dao Eterno
# Uso: clique direito -> "Executar com PowerShell"  OU  no terminal: .\deploy.ps1

Set-Location $PSScriptRoot

Write-Host "Parando processos anteriores..." -ForegroundColor Yellow
Get-Process -Name "ngrok","node" -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "Fazendo build..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "BUILD FALHOU" -ForegroundColor Red; exit 1 }

Write-Host "Subindo preview na porta 4173..." -ForegroundColor Yellow
Start-Process -FilePath "cmd" -ArgumentList "/c", "npx vite preview --port 4173" -WindowStyle Hidden
Start-Sleep -Seconds 3

Write-Host "Subindo ngrok..." -ForegroundColor Yellow
Start-Process -FilePath "ngrok" -ArgumentList "http", "4173" -WindowStyle Hidden
Start-Sleep -Seconds 4

$url = (Invoke-RestMethod http://localhost:4040/api/tunnels).tunnels[0].public_url
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  URL publica: $url" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Pressione qualquer tecla para fechar..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
