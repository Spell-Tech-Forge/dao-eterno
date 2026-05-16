#!/usr/bin/env bash
# =============================================================================
# Dao Eterno — Atualizar deploy existente
# Execute como root: bash scripts/update-vps.sh
# =============================================================================
set -euo pipefail

APP_DIR="/opt/dao-eterno"
APP_USER="daoetern"

GREEN='\033[0;32m'; CYAN='\033[0;36m'; NC='\033[0m'
info() { echo -e "${GREEN}[✔]${NC} $*"; }
step() { echo -e "\n${CYAN}[→]${NC} $*"; }

[ "$(id -u)" -eq 0 ] || { echo "Execute como root: sudo bash $0"; exit 1; }

step "Baixando atualizações do GitHub..."
chown -R "$APP_USER:$APP_USER" "$APP_DIR"
sudo -u "$APP_USER" git -C "$APP_DIR" pull
info "Código atualizado."

step "Rodando schema (migrations)..."
source <(grep DATABASE_URL "$APP_DIR/server/.env")
psql "$DATABASE_URL" -f "$APP_DIR/server/schema.sql" &>/dev/null
info "Schema aplicado."

step "Rebuilding frontend..."
cd "$APP_DIR"
sudo -u "$APP_USER" npm install --silent
sudo -u "$APP_USER" npm run build
info "Frontend buildado."

step "Rebuilding backend..."
cd "$APP_DIR/server"
sudo -u "$APP_USER" npm install --silent
sudo -u "$APP_USER" npm run build
info "Backend compilado."

step "Reiniciando servidor..."
sudo -u "$APP_USER" bash -c "
  cd $APP_DIR/server
  pm2 restart dao-eterno 2>/dev/null \
    || pm2 start dist/index.js --name dao-eterno --restart-delay=3000
  pm2 save
"
info "Servidor reiniciado."

echo ""
echo "✅ Atualização concluída!"
sudo -u "$APP_USER" pm2 status
