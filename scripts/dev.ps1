# =============================================================================
# Dao Eterno — Servidor de Desenvolvimento
# Uso: scripts\dev.ps1
# =============================================================================

$projectRoot = Split-Path $PSScriptRoot -Parent

Write-Host ""
Write-Host "🐉 Iniciando Dao Eterno (modo dev)..." -ForegroundColor DarkYellow
Write-Host ""

# Parar processos anteriores do projeto
Get-Process -Name "node" -ErrorAction SilentlyContinue |
    Where-Object { $_.MainWindowTitle -like "*dao*" } |
    Stop-Process -Force -ErrorAction SilentlyContinue

# Subir servidor Express em nova janela
Write-Host "  [1/2] Subindo servidor Express (porta 3001)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "& { `$host.ui.RawUI.WindowTitle = 'Dao Eterno — Server'; cd '$projectRoot\server'; npm run dev }"
) -WindowStyle Normal

Start-Sleep -Seconds 2

# Subir Vite frontend em nova janela
Write-Host "  [2/2] Subindo Vite frontend (porta 5173)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "& { `$host.ui.RawUI.WindowTitle = 'Dao Eterno — Frontend'; cd '$projectRoot'; npm run dev }"
) -WindowStyle Normal

Write-Host ""
Write-Host "  Aguarde alguns segundos e acesse:" -ForegroundColor White
Write-Host "  http://localhost:5173" -ForegroundColor Green
Write-Host ""
