# =============================================================================
# Dao Eterno — Setup Inicial
# Uso: scripts\setup.ps1
# =============================================================================

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path $PSScriptRoot -Parent

Write-Host ""
Write-Host "╔══════════════════════════════════╗" -ForegroundColor DarkYellow
Write-Host "║    DAO ETERNO — SETUP INICIAL    ║" -ForegroundColor DarkYellow
Write-Host "╚══════════════════════════════════╝" -ForegroundColor DarkYellow
Write-Host ""

# ── 1. Instalar dependências do frontend ──────────────────────────────────────
Write-Host "[1/5] Instalando dependências do frontend..." -ForegroundColor Cyan
Set-Location $projectRoot
npm ci --prefer-offline 2>&1 | Out-Null
Write-Host "      OK" -ForegroundColor Green

# ── 2. Instalar dependências do servidor ──────────────────────────────────────
Write-Host "[2/5] Instalando dependências do servidor..." -ForegroundColor Cyan
Set-Location "$projectRoot\server"
npm ci --prefer-offline 2>&1 | Out-Null
Write-Host "      OK" -ForegroundColor Green

# ── 3. Verificar arquivo .env do servidor ─────────────────────────────────────
Write-Host "[3/5] Verificando configuração do servidor..." -ForegroundColor Cyan
$envFile = "$projectRoot\server\.env"
if (-not (Test-Path $envFile)) {
    Write-Host ""
    Write-Host "  ATENÇÃO: Arquivo server\.env não encontrado!" -ForegroundColor Yellow
    Write-Host "  Copie server\.env.example para server\.env e preencha os valores:" -ForegroundColor Yellow
    Write-Host "    DATABASE_URL=postgresql://postgres:SENHA@localhost:5432/dao_eterno" -ForegroundColor Gray
    Write-Host "    JWT_SECRET=chave_secreta_longa_aqui" -ForegroundColor Gray
    Write-Host "    PORT=3001" -ForegroundColor Gray
    Write-Host ""

    $create = Read-Host "  Deseja criar o .env com valores padrão de DEV agora? (s/n)"
    if ($create -eq "s") {
        $jwtSecret = [System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
        @"
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dao_eterno
JWT_SECRET=$jwtSecret
PORT=3001
"@ | Set-Content $envFile -Encoding utf8
        Write-Host "      .env criado com valores padrão de DEV." -ForegroundColor Green
        Write-Host "      JWT_SECRET gerado automaticamente." -ForegroundColor Green
    }
} else {
    Write-Host "      .env encontrado." -ForegroundColor Green
}

# ── 4. Criar banco de dados PostgreSQL ────────────────────────────────────────
Write-Host "[4/5] Configurando banco de dados PostgreSQL..." -ForegroundColor Cyan
$pgAvailable = Get-Command psql -ErrorAction SilentlyContinue
if ($pgAvailable) {
    try {
        psql -U postgres -c "SELECT 1 FROM pg_database WHERE datname = 'dao_eterno'" 2>&1 | Out-Null
        $dbExists = psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='dao_eterno'" 2>$null
        if ($dbExists -ne "1") {
            psql -U postgres -c "CREATE DATABASE dao_eterno;" 2>&1 | Out-Null
            Write-Host "      Banco 'dao_eterno' criado." -ForegroundColor Green
        } else {
            Write-Host "      Banco 'dao_eterno' já existe." -ForegroundColor Green
        }
        psql -U postgres -d dao_eterno -f "$projectRoot\server\schema.sql" 2>&1 | Out-Null
        Write-Host "      Schema aplicado com sucesso." -ForegroundColor Green
    } catch {
        Write-Host "      Aviso: Não foi possível configurar o banco automaticamente." -ForegroundColor Yellow
        Write-Host "      Execute manualmente:" -ForegroundColor Yellow
        Write-Host "        psql -U postgres -c `"CREATE DATABASE dao_eterno;`"" -ForegroundColor Gray
        Write-Host "        psql -U postgres -d dao_eterno -f server\schema.sql" -ForegroundColor Gray
    }
} else {
    Write-Host "      psql não encontrado no PATH." -ForegroundColor Yellow
    Write-Host "      Execute manualmente após instalar o PostgreSQL:" -ForegroundColor Yellow
    Write-Host "        psql -U postgres -c `"CREATE DATABASE dao_eterno;`"" -ForegroundColor Gray
    Write-Host "        psql -U postgres -d dao_eterno -f server\schema.sql" -ForegroundColor Gray
}

# ── 5. Build inicial do frontend ──────────────────────────────────────────────
Write-Host "[5/5] Verificando build do frontend..." -ForegroundColor Cyan
Set-Location $projectRoot
if (-not (Test-Path "$projectRoot\dist\index.html")) {
    Write-Host "      Rodando build..." -ForegroundColor Gray
    npm run build 2>&1 | Out-Null
    Write-Host "      Build concluído." -ForegroundColor Green
} else {
    Write-Host "      Build já existe." -ForegroundColor Green
}

# ── Concluído ──────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "╔══════════════════════════════════╗" -ForegroundColor Green
Write-Host "║        SETUP CONCLUÍDO! 🐉       ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "  Para rodar em desenvolvimento:" -ForegroundColor White
Write-Host "    .\scripts\dev.ps1" -ForegroundColor Cyan
Write-Host ""
