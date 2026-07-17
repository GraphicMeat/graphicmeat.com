#!/usr/bin/env bash
# Stand up graphicmeat.com as a Node (Express) service behind Caddy on the Hetzner VPS.
# Mirrors the mailvault-api pattern: /opt code dir, dedicated system user, systemd unit,
# split env (/etc/graphicmeat/.env public + secrets.env), Caddy reverse_proxy.
#
# Idempotent — safe to re-run. Run on the box AS ROOT from the rsync'd source dir:
#   sudo bash ~/graphicmeat-deploy/deploy/standup.sh
#
# It flips Caddy to the Node app ONLY after the app answers on its port, so a broken
# build can't take the site down.
set -euo pipefail

APP_USER=graphicmeat
APP_DIR=/opt/graphicmeat
ENV_DIR=/etc/graphicmeat
PORT=3002
SRC="$(cd "$(dirname "$0")/.." && pwd)"   # repo root (parent of deploy/)
CADDYFILE=/etc/caddy/Caddyfile

[[ $EUID -eq 0 ]] || { echo "Run as root: sudo bash $0"; exit 1; }

echo "==> 1/8 system user"
id -u "$APP_USER" &>/dev/null || useradd --system --no-create-home --shell /usr/sbin/nologin "$APP_USER"

echo "==> 2/8 sync code to $APP_DIR"
mkdir -p "$APP_DIR"
rsync -a --delete --exclude '.git' --exclude 'node_modules' --exclude '.env' "$SRC"/ "$APP_DIR"/

echo "==> 3/8 npm install (production)"
cd "$APP_DIR"
npm ci --omit=dev

echo "==> 4/8 env files in $ENV_DIR"
mkdir -p "$ENV_DIR"
# secrets.env holds DB_PASS + IP_SALT + the grill SMTP app password.
# Env vars passed to this script (e.g. from CI) WIN over the existing file; the file is
# only a fallback so values generated on a prior run survive a re-run.
IN_DB_PASS="${DB_PASS:-}"; IN_IP_SALT="${IP_SALT:-}"; IN_GRILL="${GRILL_EMAIL_SMTP_APP_PASSWORD:-}"
IN_AN_KEY="${ANALYTICS_API_KEY:-}"
IN_MV_URL="${MAILVAULT_ANALYTICS_URL:-}"; IN_MV_KEY="${MAILVAULT_ANALYTICS_KEY:-}"
IN_ADMIN_KEY="${ADMIN_KEY:-}"
if [[ -f "$ENV_DIR/secrets.env" ]]; then
    # shellcheck disable=SC1091
    source "$ENV_DIR/secrets.env"
fi
DB_PASS="${IN_DB_PASS:-${DB_PASS:-$(openssl rand -hex 24)}}"
IP_SALT="${IN_IP_SALT:-${IP_SALT:-$(openssl rand -hex 24)}}"
GRILL_EMAIL_SMTP_APP_PASSWORD="${IN_GRILL:-${GRILL_EMAIL_SMTP_APP_PASSWORD:-}}"
if [[ -z "${GRILL_EMAIL_SMTP_APP_PASSWORD:-}" ]]; then
    if [[ -t 0 ]]; then
        read -rs -p "Purelymail app password for grill@graphicmeat.com: " GRILL_EMAIL_SMTP_APP_PASSWORD
        echo
    else
        echo "WARN: GRILL_EMAIL_SMTP_APP_PASSWORD unset and no tty — deploying with email DISABLED."
        echo "      Set it later in $ENV_DIR/secrets.env and 'systemctl restart graphicmeat'."
    fi
fi
GRILL_EMAIL_SMTP_APP_PASSWORD="${GRILL_EMAIL_SMTP_APP_PASSWORD:-}"
# meatlytics: CI value wins, else keep existing, else generate. Dashboard login is
# passkey-based (first boot logs a one-time setup path to journalctl).
ANALYTICS_API_KEY="${IN_AN_KEY:-${ANALYTICS_API_KEY:-$(openssl rand -hex 32)}}"
MAILVAULT_ANALYTICS_URL="${IN_MV_URL:-${MAILVAULT_ANALYTICS_URL:-}}"
MAILVAULT_ANALYTICS_KEY="${IN_MV_KEY:-${MAILVAULT_ANALYTICS_KEY:-}}"
# admin API key for GET /api/admin/subscribers (CI value wins, else keep existing, else generate)
ADMIN_KEY="${IN_ADMIN_KEY:-${ADMIN_KEY:-$(openssl rand -hex 32)}}"

cat > "$ENV_DIR/.env" <<EOF
# Public (non-secret) config for graphicmeat.com. Managed by deploy/standup.sh.
SITE_URL=https://graphicmeat.com
PORT=$PORT
CONTACT_TO=prime@graphicmeat.com
NEWSLETTER_NOTIFY=prime@graphicmeat.com
SMTP_HOST=smtp.purelymail.com
# Port 465 is blocked outbound on this box — use 587 STARTTLS (same as mailvault-api).
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=grill@graphicmeat.com
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=graphicmeat
DB_NAME=graphicmeat
EOF

cat > "$ENV_DIR/secrets.env" <<EOF
DB_PASS=$DB_PASS
IP_SALT=$IP_SALT
GRILL_EMAIL_SMTP_APP_PASSWORD=$GRILL_EMAIL_SMTP_APP_PASSWORD
ANALYTICS_API_KEY=$ANALYTICS_API_KEY
MAILVAULT_ANALYTICS_URL=$MAILVAULT_ANALYTICS_URL
MAILVAULT_ANALYTICS_KEY=$MAILVAULT_ANALYTICS_KEY
ADMIN_KEY=$ADMIN_KEY
EOF
chown -R "$APP_USER:$APP_USER" "$ENV_DIR" "$APP_DIR"
chmod 600 "$ENV_DIR/secrets.env"

echo "==> 5/8 database"
mysql <<SQL
CREATE DATABASE IF NOT EXISTS graphicmeat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'graphicmeat'@'localhost' IDENTIFIED BY '$DB_PASS';
ALTER USER 'graphicmeat'@'localhost' IDENTIFIED BY '$DB_PASS';
GRANT ALL PRIVILEGES ON graphicmeat.* TO 'graphicmeat'@'localhost';
FLUSH PRIVILEGES;
SQL

echo "==> 6/8 systemd unit"
cat > /etc/systemd/system/graphicmeat.service <<'EOF'
[Unit]
Description=GraphicMeat website (Express)
After=network.target mariadb.service
Wants=mariadb.service

[Service]
Type=simple
User=graphicmeat
Group=graphicmeat
WorkingDirectory=/opt/graphicmeat
EnvironmentFile=/etc/graphicmeat/.env
EnvironmentFile=-/etc/graphicmeat/secrets.env
ExecStart=/usr/bin/node app.js
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=graphicmeat

# Hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/graphicmeat
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectControlGroups=true
RestrictNamespaces=true
LockPersonality=true
RestrictRealtime=true

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable graphicmeat.service
systemctl restart graphicmeat.service

echo "==> 7/8 health check on :$PORT"
ok=""
for i in $(seq 1 10); do
    if curl -fsS "http://127.0.0.1:$PORT/" >/dev/null 2>&1; then ok=1; break; fi
    sleep 1
done
if [[ -z "$ok" ]]; then
    echo "!! app did not answer on :$PORT — NOT touching Caddy. Recent logs:"
    journalctl -u graphicmeat.service -n 40 --no-pager
    exit 1
fi
echo "   app healthy on :$PORT"

echo "==> 8/8 Caddy reverse_proxy"
cp "$CADDYFILE" "$CADDYFILE.bak-$(date +%Y%m%d-%H%M%S)"
python3 - "$CADDYFILE" "$PORT" <<'PY'
import sys
path, port = sys.argv[1], sys.argv[2]
src = open(path).read()
marker = "graphicmeat.com, www.graphicmeat.com {"
i = src.find(marker)
if i == -1:
    sys.exit("graphicmeat block not found in Caddyfile")
# brace-match from the opening { to its close
j = src.index("{", i)
depth, k = 0, j
while k < len(src):
    if src[k] == "{": depth += 1
    elif src[k] == "}":
        depth -= 1
        if depth == 0: break
    k += 1
block = f"""graphicmeat.com, www.graphicmeat.com {{
    tls /etc/caddy/certs/graphicmeat.com.crt /etc/caddy/certs/graphicmeat.com.key
    encode zstd gzip
    reverse_proxy 127.0.0.1:{port}
    header {{
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
        X-Content-Type-Options nosniff
        Referrer-Policy no-referrer
        -Server
    }}
}}"""
open(path, "w").write(src[:i] + block + src[k+1:])
print("   Caddyfile graphicmeat block -> reverse_proxy 127.0.0.1:" + port)
PY
caddy validate --config "$CADDYFILE" --adapter caddyfile
systemctl reload caddy

echo
echo "DONE. graphicmeat.com now served by the Node app on :$PORT via Caddy."
curl -fsS -o /dev/null -w "  local https check: %{http_code}\n" https://graphicmeat.com/ || true
