# Deploy — O Dao Eterno

## Visão geral

| Componente | Tecnologia |
|---|---|
| Frontend | React + Vite → arquivos estáticos em `/dist` |
| Backend | Node.js + Express na porta `3001` |
| Banco | PostgreSQL |
| Processo | PM2 (auto-restart + boot automático) |
| Proxy / HTTPS | Nginx + Let's Encrypt via DuckDNS |

---

## 1. Pré-requisitos (máquina local)

- Git configurado com acesso ao repositório
- Código commitado e pushed no branch `main`

```bash
git push origin main
```

---

## 2. Pré-requisitos (VM)

- Ubuntu 24.04 LTS
- Acesso root via SSH
- Porta 80 e 443 abertas no firewall da provedora da VM

---

## 3. DuckDNS (domínio gratuito)

> Faça isso **antes** de rodar o script na VM.

1. Acesse **https://www.duckdns.org** e faça login (Google ou GitHub)
2. Crie o subdomínio `o-dao-eterno` → aponte para o IP da VM
3. O token já está configurado no script de deploy

URL final: **https://o-dao-eterno.duckdns.org**

---

## 4. Primeiro deploy (instalação completa)

Conecte na VM como root e execute:

```bash
curl -fsSL https://raw.githubusercontent.com/Spell-Tech-Forge/dao-eterno/main/scripts/setup-vps.sh | bash
```

O script (~5-10 min) faz automaticamente:

1. Atualiza o Ubuntu e instala dependências
2. Instala Node.js 20 LTS
3. Instala PostgreSQL e cria o banco `dao_eterno`
4. Instala Nginx e Certbot
5. Instala PM2
6. Atualiza o IP no DuckDNS e configura cron a cada 5 min
7. Clona o repositório em `/opt/dao-eterno`
8. Cria o arquivo `.env` com secrets gerados aleatoriamente
9. Roda `npm run build` (frontend e backend)
10. Roda o seed (admin + itens + monstros + receitas)
11. Inicia o servidor com PM2 (configurado para subir no boot)
12. Emite certificado Let's Encrypt para `o-dao-eterno.duckdns.org`
13. Configura Nginx como reverse proxy com HTTPS
14. Ativa UFW (firewall: libera 22, 80, 443)

**Ao final:**

```
URL:    https://o-dao-eterno.duckdns.org
Admin:  kyuurigames@gmail.com / @Kungfu123
```

---

## 5. Atualizar deploy existente

Após dar push de novas alterações no GitHub:

```bash
sudo bash /opt/dao-eterno/scripts/update-vps.sh
```

O script de atualização faz:
1. `git pull` no repositório
2. Aplica migrations do schema (idempotente)
3. Rebuild do frontend e backend
4. Reinicia o PM2

---

## 6. Comandos úteis na VM

```bash
# Ver logs do servidor em tempo real
sudo -u daoetern pm2 logs dao-eterno

# Reiniciar o servidor
sudo -u daoetern pm2 restart dao-eterno

# Status dos processos
sudo -u daoetern pm2 status

# Testar configuração do Nginx
nginx -t

# Recarregar Nginx sem derrubar conexões
systemctl reload nginx

# Ver logs do Nginx
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log

# Renovar certificado manualmente (renovação automática já está configurada)
certbot renew --nginx

# Ver variáveis de ambiente do servidor
cat /opt/dao-eterno/server/.env
```

---

## 7. Estrutura de arquivos na VM

```
/opt/dao-eterno/
├── dist/               ← Frontend buildado (servido pelo Nginx)
├── uploads/
│   ├── items/          ← Sprites de itens
│   └── monsters/       ← Sprites de monstros
├── server/
│   ├── dist/           ← Backend compilado (rodado pelo PM2)
│   ├── .env            ← Secrets (DATABASE_URL, JWT_SECRET)
│   └── schema.sql
├── scripts/
│   ├── setup-vps.sh    ← Instalação completa
│   └── update-vps.sh   ← Atualizações
└── .seeded             ← Flag: seed já foi executado

/opt/duckdns/
└── duck.sh             ← Script de atualização do IP (roda via cron)

/etc/nginx/sites-available/dao-eterno   ← Config do Nginx
/etc/letsencrypt/live/o-dao-eterno.duckdns.org/  ← Certificado SSL
```

---

## 8. Renovação do certificado SSL

O Let's Encrypt expira em 90 dias. A renovação é automática via:
- **Systemd timer** instalado pelo Certbot
- **Cron** configurado pelo script (`0 3 * * *`)

Para verificar se a renovação automática está funcionando:

```bash
certbot renew --dry-run
```

---

## 9. Trocar o token DuckDNS (recomendado após o primeiro deploy)

1. Acesse **duckdns.org** e regenere o token
2. Edite o script de cron na VM:

```bash
nano /opt/duckdns/duck.sh
# Substitua o token na URL e salve
```

3. Atualize o `setup-vps.sh` no repositório com o novo token para futuros deploys

---

## 10. Troubleshooting

| Sintoma | Verificar |
|---|---|
| Site não abre | `sudo -u daoetern pm2 status` — servidor está rodando? |
| Erro 502 Bad Gateway | PM2 caiu — `pm2 restart dao-eterno` |
| Certificado expirado | `certbot renew --nginx` |
| DuckDNS não resolve | `cat /opt/duckdns/duck.log` — deve mostrar `OK` |
| Banco inacessível | `systemctl status postgresql` |
| Sem espaço em disco | `df -h` — limpar logs antigos com `pm2 flush` |
