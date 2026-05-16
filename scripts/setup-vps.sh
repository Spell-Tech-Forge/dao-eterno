#!/usr/bin/env bash
# =============================================================================
# Dao Eterno — Setup VPS (Ubuntu 24.04 LTS)
# Execute como root: bash scripts/setup-vps.sh
# =============================================================================
set -euo pipefail

# ── Cores ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()  { echo -e "${GREEN}[✔]${NC} $*"; }
step()  { echo -e "\n${CYAN}[→]${NC} $*"; }
warn()  { echo -e "${YELLOW}[!]${NC} $*"; }
die()   { echo -e "${RED}[✘]${NC} $*"; exit 1; }

[ "$(id -u)" -eq 0 ] || die "Execute como root: sudo bash $0"

# ── Configurações ──────────────────────────────────────────────────────────
APP_DIR="/opt/dao-eterno"
APP_USER="daoetern"
DB_NAME="dao_eterno"
DB_USER="dao_user"
DB_PASS="$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 28)"
JWT_SECRET="$(openssl rand -base64 64 | tr -dc 'a-zA-Z0-9' | head -c 64)"
REPO_URL="https://github.com/Spell-Tech-Forge/dao-eterno.git"
SERVER_IP="$(curl -4 -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')"
SSL_DIR="/etc/nginx/ssl/dao-eterno"

echo ""
echo -e "${CYAN}╔════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   🐉  Dao Eterno — VPS Setup           ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════╝${NC}"
echo ""
info "IP detectado: $SERVER_IP"
echo ""

# ── 1. Atualizar sistema ───────────────────────────────────────────────────
step "1/9 — Atualizando pacotes do sistema..."
apt-get update -q
DEBIAN_FRONTEND=noninteractive apt-get upgrade -yq
apt-get install -yq curl git openssl ufw
info "Sistema atualizado."

# ── 2. Node.js 20 LTS ─────────────────────────────────────────────────────
step "2/9 — Instalando Node.js 20 LTS..."
if ! command -v node &>/dev/null || [[ "$(node -e 'process.exit(parseInt(process.version.slice(1)))')" != "0" ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - &>/dev/null
  apt-get install -y nodejs &>/dev/null
fi
info "Node.js $(node --version) / npm $(npm --version)"

# ── 3. PostgreSQL ──────────────────────────────────────────────────────────
step "3/9 — Instalando PostgreSQL..."
apt-get install -yq postgresql postgresql-contrib
systemctl enable --now postgresql
info "PostgreSQL instalado."

# ── 4. Nginx ──────────────────────────────────────────────────────────────
step "4/9 — Instalando Nginx..."
apt-get install -yq nginx
systemctl enable nginx
info "Nginx instalado."

# ── 5. PM2 ────────────────────────────────────────────────────────────────
step "5/9 — Instalando PM2..."
npm install -g pm2 &>/dev/null
info "PM2 $(pm2 --version)"

# ── 6. Usuário + repositório ───────────────────────────────────────────────
step "6/9 — Configurando usuário e repositório..."
id "$APP_USER" &>/dev/null || useradd -m -s /bin/bash "$APP_USER"

if [ -d "$APP_DIR/.git" ]; then
  warn "Repositório já existe em $APP_DIR — fazendo pull..."
  git -C "$APP_DIR" pull
else
  git clone "$REPO_URL" "$APP_DIR"
fi

mkdir -p "$APP_DIR/uploads/items" "$APP_DIR/uploads/monsters"
chown -R "$APP_USER:$APP_USER" "$APP_DIR"
info "Repositório pronto em $APP_DIR"

# ── 7. Banco de dados ──────────────────────────────────────────────────────
step "7/9 — Configurando banco de dados PostgreSQL..."

# Criar usuário
su - postgres -c "psql -tAc \"SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'\"" | grep -q 1 \
  || su - postgres -c "psql -c \"CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';\""

# Criar banco
su - postgres -c "psql -tAc \"SELECT 1 FROM pg_database WHERE datname='$DB_NAME'\"" | grep -q 1 \
  || su - postgres -c "psql -c \"CREATE DATABASE $DB_NAME OWNER $DB_USER;\""

su - postgres -c "psql -c \"GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;\""
su - postgres -c "psql -d $DB_NAME -c \"GRANT ALL ON SCHEMA public TO $DB_USER;\""

# Rodar schema
PGPASSWORD="$DB_PASS" psql -U "$DB_USER" -h 127.0.0.1 -d "$DB_NAME" -f "$APP_DIR/server/schema.sql" &>/dev/null
info "Banco de dados configurado."

# ── Criar .env ─────────────────────────────────────────────────────────────
cat > "$APP_DIR/server/.env" <<EOF
DATABASE_URL=postgresql://$DB_USER:$DB_PASS@127.0.0.1/$DB_NAME
JWT_SECRET=$JWT_SECRET
PORT=3001
NODE_ENV=production
EOF
chown "$APP_USER:$APP_USER" "$APP_DIR/server/.env"
chmod 600 "$APP_DIR/server/.env"
info ".env criado."

# ── 8. Build ──────────────────────────────────────────────────────────────
step "8/9 — Instalando dependências e fazendo build..."

# Frontend
cd "$APP_DIR"
sudo -u "$APP_USER" npm install --silent
sudo -u "$APP_USER" npm run build
info "Frontend buildado → dist/"

# Backend
cd "$APP_DIR/server"
sudo -u "$APP_USER" npm install --silent
sudo -u "$APP_USER" npm run build
info "Backend compilado → server/dist/"

# Seed (somente se for primeira instalação)
if [ ! -f "$APP_DIR/.seeded" ]; then
  step "Rodando seed (admin + itens + monstros)..."
  cd "$APP_DIR/server"
  sudo -u "$APP_USER" npm run seed
  touch "$APP_DIR/.seeded"
  chown "$APP_USER:$APP_USER" "$APP_DIR/.seeded"
  info "Seed concluído."
else
  warn "Seed já foi executado anteriormente (.seeded existe). Pulando."
fi

chown -R "$APP_USER:$APP_USER" "$APP_DIR"

# ── PM2 ────────────────────────────────────────────────────────────────────
step "Configurando PM2..."
sudo -u "$APP_USER" pm2 delete dao-eterno 2>/dev/null || true
sudo -u "$APP_USER" bash -c "cd $APP_DIR/server && pm2 start dist/index.js --name dao-eterno --restart-delay=3000"
sudo -u "$APP_USER" pm2 save

# Startup script para boot automático
PM2_STARTUP=$(sudo -u "$APP_USER" pm2 startup systemd -u "$APP_USER" --hp "/home/$APP_USER" 2>/dev/null | grep "sudo" | tail -1)
if [ -n "$PM2_STARTUP" ]; then
  eval "$PM2_STARTUP"
fi
info "PM2 configurado (inicia no boot)."

# ── 9. SSL + Nginx ────────────────────────────────────────────────────────
step "9/9 — Configurando SSL e Nginx..."

# Certificado self-signed (válido por 10 anos)
mkdir -p "$SSL_DIR"
openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
  -keyout "$SSL_DIR/privkey.pem" \
  -out    "$SSL_DIR/fullchain.pem" \
  -subj   "/C=BR/ST=SP/L=SaoPaulo/O=DaoEterno/CN=$SERVER_IP" \
  2>/dev/null
chmod 600 "$SSL_DIR/privkey.pem"
info "Certificado SSL gerado (self-signed, 10 anos)."

# Configuração Nginx
cat > /etc/nginx/sites-available/dao-eterno <<NGINX
# HTTP → redireciona para HTTPS
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    return 301 https://\$host\$request_uri;
}

# HTTPS
server {
    listen 443 ssl default_server;
    listen [::]:443 ssl default_server;
    server_name _;

    ssl_certificate     $SSL_DIR/fullchain.pem;
    ssl_certificate_key $SSL_DIR/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;
    ssl_session_cache   shared:SSL:10m;
    ssl_session_timeout 1d;

    # Segurança
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options SAMEORIGIN;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;

    # Upload máx 10MB (sprites)
    client_max_body_size 10M;

    # API Express (proxy)
    location /api/ {
        proxy_pass         http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade \$http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host \$host;
        proxy_set_header   X-Real-IP \$remote_addr;
        proxy_set_header   X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Uploads — servido direto pelo Nginx (mais eficiente)
    location /uploads/ {
        alias $APP_DIR/uploads/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
        add_header X-Content-Type-Options nosniff;
    }

    # Frontend SPA (arquivos estáticos)
    root $APP_DIR/dist;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Cache agressivo para assets com hash
    location ~* \.(js|css|woff2?|ttf|eot|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINX

# Ativar site e remover default
ln -sf /etc/nginx/sites-available/dao-eterno /etc/nginx/sites-enabled/dao-eterno
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl restart nginx
info "Nginx configurado."

# ── Firewall ────────────────────────────────────────────────────────────────
ufw --force enable
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
info "Firewall configurado (22, 80, 443)."

# ── Resumo ──────────────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   🐉  Dao Eterno — Deploy Concluído!             ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${GREEN}URL:${NC}     https://$SERVER_IP"
echo -e "  ${GREEN}Admin:${NC}   admin@dao.com  /  Admin@1234"
echo ""
echo -e "  ${YELLOW}⚠️  Certificado self-signed:${NC}"
echo "     O navegador vai mostrar aviso de segurança."
echo "     Clique em 'Avançado → Continuar para o site' para acessar."
echo "     (Chrome: 'thisisunsafe' | Firefox: 'Aceitar o risco')"
echo ""
echo -e "  ${CYAN}Comandos úteis:${NC}"
echo "     Ver logs:      sudo -u daoetern pm2 logs dao-eterno"
echo "     Reiniciar:     sudo -u daoetern pm2 restart dao-eterno"
echo "     Atualizar:     bash $APP_DIR/scripts/update-vps.sh"
echo ""
echo -e "  ${YELLOW}Credenciais do banco (guarde!):${NC}"
echo "     DB_USER: $DB_USER"
echo "     DB_PASS: $DB_PASS"
echo ""
