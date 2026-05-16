# =============================================================================
# Dao Eterno — Parar todos os processos
# Uso: scripts\stop.ps1
# =============================================================================

Write-Host "Parando todos os processos do Dao Eterno..." -ForegroundColor Yellow
Get-Process -Name "node","ngrok" -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Host "Pronto." -ForegroundColor Green
