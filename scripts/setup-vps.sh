#!/usr/bin/env bash
# =============================================================================
# Dao Eterno — Setup VPS (Ubuntu 24.04 LTS)
# Suporta DuckDNS + Let's Encrypt ou self-signed (sem domínio)
# Execute como root: bash scripts/setup-vps.sh
# =============================================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info() { echo -e "${GREEN}[✔]${NC} $*"; }
step() { echo -e "\n${CYAN}[→]${NC} $*"; }
warn() { echo -e "${YELLOW}[!]${NC} $*"; }
die()  { echo -e "${RED}[✘]${NC} $*"; exit 1; }

[ "$(id -u)" -eq 0 ] || die "Execute como root: sudo bash $0"

# ── Configurações fixas ────────────────────────────────────────────────────
APP_DIR="/opt/dao-eterno"
APP_USER="daoetern"
DB_NAME="dao_eterno"
DB_USER="dao_user"
DB_PASS="$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 28)"
JWT_SECRET="$(openssl rand -base64 64 | tr -dc 'a-zA-Z0-9' | head -c 64)"
REPO_URL="https://github.com/Spell-Tech-Forge/dao-eterno.git"
SERVER_IP="$(curl -4 -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')"

echo ""
echo -e "${CYAN}╔════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   🐉  Dao Eterno — VPS Setup           ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════╝${NC}"
echo ""
info "IP do servidor: $SERVER_IP"
echo ""

# ── DuckDNS ────────────────────────────────────────────────────────────────
echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  Configuração DuckDNS + HTTPS (Let's Encrypt)          ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
DUCK_SUBDOMAIN="o-dao-eterno"
DUCK_TOKEN="7344da98-9f88-4432-be59-052021d3a56b"
echo ""

DOMAIN="${DUCK_SUBDOMAIN}.duckdns.org"
info "Domínio: $DOMAIN"

# ── 1. Atualizar sistema ───────────────────────────────────────────────────
step "1/9 — Atualizando pacotes..."
apt-get update -q
DEBIAN_FRONTEND=noninteractive apt-get upgrade -yq
apt-get install -yq curl git openssl ufw cron
info "Sistema atualizado."

# ── 2. Node.js 20 LTS ─────────────────────────────────────────────────────
step "2/9 — Instalando Node.js 20 LTS..."
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - &>/dev/null
  apt-get install -y nodejs &>/dev/null
fi
info "Node.js $(node --version) / npm $(npm --version)"

# ── 3. PostgreSQL ──────────────────────────────────────────────────────────
step "3/9 — Instalando PostgreSQL..."
apt-get install -yq postgresql postgresql-contrib
systemctl enable --now postgresql
info "PostgreSQL instalado."

# ── 4. Nginx + Certbot ────────────────────────────────────────────────────
step "4/9 — Instalando Nginx e Certbot..."
apt-get install -yq nginx certbot python3-certbot-nginx
systemctl enable nginx
info "Nginx e Certbot instalados."

# ── 5. PM2 ────────────────────────────────────────────────────────────────
step "5/9 — Instalando PM2..."
npm install -g pm2 &>/dev/null
info "PM2 $(pm2 --version)"

# ── 6. DuckDNS — atualizar IP e configurar cron ───────────────────────────
step "6/9 — Configurando DuckDNS..."
mkdir -p /opt/duckdns

cat > /opt/duckdns/duck.sh <<DUCK
#!/bin/bash
curl -fsSL "https://www.duckdns.org/update?domains=${DUCK_SUBDOMAIN}&token=${DUCK_TOKEN}&ip=" \
  -o /opt/duckdns/duck.log
echo "" >> /opt/duckdns/duck.log
DUCK
chmod +x /opt/duckdns/duck.sh

# Atualiza agora
bash /opt/duckdns/duck.sh
sleep 2
DUCK_RESULT=$(cat /opt/duckdns/duck.log | head -1)
if [ "$DUCK_RESULT" = "OK" ]; then
  info "DuckDNS atualizado: $DOMAIN → $SERVER_IP"
else
  warn "DuckDNS respondeu: '$DUCK_RESULT' — verifique o token e o subdomínio."
fi

# Cron: atualiza o IP a cada 5 minutos
(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/duckdns/duck.sh >/dev/null 2>&1") | crontab -
info "Cron DuckDNS configurado (atualiza a cada 5 minutos)."

# ── 7. Usuário + repositório ───────────────────────────────────────────────
step "7/9 — Clonando repositório..."
id "$APP_USER" &>/dev/null || useradd -m -s /bin/bash "$APP_USER"

if [ -d "$APP_DIR/.git" ]; then
  warn "Repositório já existe — fazendo pull..."
  git config --global --add safe.directory "$APP_DIR" 2>/dev/null || true
  sudo -u "$APP_USER" git -C "$APP_DIR" pull
else
  git clone "$REPO_URL" "$APP_DIR"
fi

mkdir -p "$APP_DIR/uploads/items" "$APP_DIR/uploads/monsters"
chown -R "$APP_USER:$APP_USER" "$APP_DIR"
info "Repositório pronto em $APP_DIR"

# ── 8. Banco de dados ──────────────────────────────────────────────────────
step "8/9 — Configurando PostgreSQL..."

su - postgres -c "psql -tAc \"SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'\"" | grep -q 1 \
  || su - postgres -c "psql -c \"CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';\""

su - postgres -c "psql -tAc \"SELECT 1 FROM pg_database WHERE datname='$DB_NAME'\"" | grep -q 1 \
  || su - postgres -c "psql -c \"CREATE DATABASE $DB_NAME OWNER $DB_USER;\""

su - postgres -c "psql -c \"GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;\""
su - postgres -c "psql -d $DB_NAME -c \"GRANT ALL ON SCHEMA public TO $DB_USER;\""

PGPASSWORD="$DB_PASS" psql -U "$DB_USER" -h 127.0.0.1 -d "$DB_NAME" -f "$APP_DIR/server/schema.sql" &>/dev/null
info "Banco de dados configurado."

cat > "$APP_DIR/server/.env" <<ENV
DATABASE_URL=postgresql://$DB_USER:$DB_PASS@127.0.0.1/$DB_NAME
JWT_SECRET=$JWT_SECRET
PORT=3001
NODE_ENV=production
ENV
chown "$APP_USER:$APP_USER" "$APP_DIR/server/.env"
chmod 600 "$APP_DIR/server/.env"
info ".env criado."

# ── Build ──────────────────────────────────────────────────────────────────
step "Instalando dependências e buildando..."

cd "$APP_DIR"
sudo -u "$APP_USER" npm install --silent
sudo -u "$APP_USER" npm run build
info "Frontend buildado → dist/"

cd "$APP_DIR/server"
sudo -u "$APP_USER" npm install --silent
sudo -u "$APP_USER" npm run build
info "Backend compilado → server/dist/"

if [ ! -f "$APP_DIR/.seeded" ]; then
  step "Rodando seed (admin + itens + monstros)..."
  cd "$APP_DIR/server"
  sudo -u "$APP_USER" npm run seed
  touch "$APP_DIR/.seeded"
  chown "$APP_USER:$APP_USER" "$APP_DIR/.seeded"
  info "Seed concluído."
else
  warn "Seed já executado (.seeded existe). Pulando."
fi

chown -R "$APP_USER:$APP_USER" "$APP_DIR"

# ── PM2 ────────────────────────────────────────────────────────────────────
sudo -u "$APP_USER" pm2 delete dao-eterno 2>/dev/null || true
sudo -u "$APP_USER" bash -c "cd $APP_DIR/server && pm2 start dist/index.js --name dao-eterno --restart-delay=3000"
sudo -u "$APP_USER" pm2 save

PM2_STARTUP=$(sudo -u "$APP_USER" pm2 startup systemd -u "$APP_USER" --hp "/home/$APP_USER" 2>/dev/null | grep "sudo" | tail -1)
[ -n "$PM2_STARTUP" ] && eval "$PM2_STARTUP"
info "PM2 configurado (inicia no boot)."

# ── 9. Nginx provisório (HTTP) + Let's Encrypt ────────────────────────────
step "9/9 — Configurando Nginx e emitindo certificado Let's Encrypt..."

# Config Nginx temporária (só HTTP) para que o Certbot valide o domínio
cat > /etc/nginx/sites-available/dao-eterno <<NGINX_TMP
server {
    listen 80;
    server_name $DOMAIN;
    root $APP_DIR/dist;
    index index.html;
    location / { try_files \$uri \$uri/ /index.html; }
}
NGINX_TMP

ln -sf /etc/nginx/sites-available/dao-eterno /etc/nginx/sites-enabled/dao-eterno
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# Emitir certificado Let's Encrypt
info "Emitindo certificado para $DOMAIN..."
certbot --nginx \
  --non-interactive \
  --agree-tos \
  --email kyuurigames@gmail.com \
  --domains "$DOMAIN" \
  --redirect

# Config Nginx final (com HTTPS completo)
cat > /etc/nginx/sites-available/dao-eterno <<NGINX_FINAL
# HTTP → HTTPS
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$host\$request_uri;
}

# HTTPS
server {
    listen 443 ssl;
    server_name $DOMAIN;

    ssl_certificate     /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options SAMEORIGIN;

    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml image/svg+xml;

    client_max_body_size 10M;

    # API Express
    location /api/ {
        proxy_pass         http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header   Host \$host;
        proxy_set_header   X-Real-IP \$remote_addr;
        proxy_set_header   X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
    }

    # Uploads — servido direto pelo Nginx
    location /uploads/ {
        alias $APP_DIR/uploads/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # Frontend SPA
    root $APP_DIR/dist;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location ~* \.(js|css|woff2?|ttf|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
NGINX_FINAL

nginx -t && systemctl reload nginx
info "Nginx configurado com HTTPS."

# Renovação automática do certificado (Certbot já instala um timer systemd,
# mas adicionamos verificação no cron também)
(crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --nginx") | sort -u | crontab -

# ── Firewall ────────────────────────────────────────────────────────────────
ufw --force enable
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
info "Firewall configurado (22, 80, 443)."

# ── Resumo ──────────────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   🐉  Dao Eterno — Deploy Concluído!                 ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${GREEN}URL:${NC}     https://$DOMAIN"
echo -e "  ${GREEN}Admin:${NC}   kyuurigames@gmail.com  /  @Kungfu123"
echo ""
echo -e "  ${GREEN}HTTPS:${NC}   Certificado Let's Encrypt válido ✅"
echo -e "            Renovação automática configurada"
echo ""
echo -e "  ${CYAN}Comandos úteis:${NC}"
echo "     Ver logs:    sudo -u daoetern pm2 logs dao-eterno"
echo "     Reiniciar:   sudo -u daoetern pm2 restart dao-eterno"
echo "     Atualizar:   sudo bash $APP_DIR/scripts/update-vps.sh"
echo ""
echo -e "  ${YELLOW}Credenciais do banco (guarde!):${NC}"
echo "     DB_USER: $DB_USER"
echo "     DB_PASS: $DB_PASS"
echo ""
