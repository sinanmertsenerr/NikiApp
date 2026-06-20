#!/bin/bash
# CI/CD Option A — VM-side auto-deploy.
# Installs /opt/niki/deploy.sh (clone-or-pull main, copy env, docker compose up)
# and a systemd timer that runs it every 2 minutes. The API container runs
# `prisma migrate deploy` on start, so migrations are automatic.
#
# Run on the VM (via: gcloud compute ssh niki-backend --project niki-app-260620 \
#   --zone europe-west3-c --command="sudo bash /tmp/niki-cicd-setup.sh")
set -e

cat > /opt/niki/deploy.sh <<'DEPLOYEOF'
#!/bin/bash
# Niki VM auto-deploy: pull main, then rebuild whatever changed.
#   backend/* -> docker compose up --build
#   mobile/*  -> build web in a node container -> /var/www/niki -> nginx reload
# Flags: --force (rebuild both)  --web (force web rebuild only)
set -e
export GIT_SSH_COMMAND="ssh -i /opt/niki/deploy_key -o StrictHostKeyChecking=accept-new -o IdentitiesOnly=yes"
REPO="git@github.com:sinanmertsenerr/NikiApp.git"
APP=/opt/niki/app
WEB_ROOT=/var/www/niki
WEB_API_URL="https://nikiapi.sinansener.com"
FORCE="${1:-}"

CHANGED=0; FILES=""
if [ ! -d "$APP/.git" ]; then
  git clone "$REPO" "$APP"; CHANGED=1; FILES="ALL"
else
  git -C "$APP" fetch --quiet origin main
  LOCAL=$(git -C "$APP" rev-parse HEAD); REMOTE=$(git -C "$APP" rev-parse origin/main)
  if [ "$LOCAL" != "$REMOTE" ]; then
    FILES=$(git -C "$APP" diff --name-only "$LOCAL" "$REMOTE")
    git -C "$APP" reset --hard origin/main; CHANGED=1
  fi
fi
[ "$FORCE" = "--force" ] && { CHANGED=1; FILES="ALL"; }
[ "$FORCE" = "--web" ]   && { CHANGED=1; FILES="mobile/forced"; }
[ "$CHANGED" != "1" ] && { echo "[deploy] no change $(date -u)"; exit 0; }

# ---- Backend ----
if echo "$FILES" | grep -q '^backend/' || [ "$FILES" = "ALL" ]; then
  cp /opt/niki/.env.production "$APP/backend/.env"
  ( cd "$APP/backend" && docker compose up -d --build )
  echo "[deploy] backend updated"
fi

# ---- Web (built inside a node container, no host Node required) ----
if echo "$FILES" | grep -q '^mobile/' || [ "$FILES" = "ALL" ] || [ ! -f "$WEB_ROOT/index.html" ]; then
  docker run --rm -v "$APP":/app -w /app/mobile -e EXPO_PUBLIC_API_URL="$WEB_API_URL" node:20 \
    sh -c "npm ci --no-audit --no-fund && npm run build:web"
  mkdir -p "$WEB_ROOT"
  rm -rf "${WEB_ROOT:?}/"*
  cp -a "$APP/mobile/dist/." "$WEB_ROOT/"
  find "$WEB_ROOT" -name '._*' -delete 2>/dev/null || true
  chown -R www-data:www-data "$WEB_ROOT"
  nginx -t && systemctl reload nginx
  echo "[deploy] web updated"
fi

docker image prune -f >/dev/null 2>&1 || true
echo "[deploy] done $(date -u)"
DEPLOYEOF
chmod +x /opt/niki/deploy.sh

cat > /etc/systemd/system/niki-deploy.service <<'SVCEOF'
[Unit]
Description=Niki auto-deploy (pull main + docker compose up)
After=docker.service
Requires=docker.service
[Service]
Type=oneshot
ExecStart=/opt/niki/deploy.sh
SVCEOF

cat > /etc/systemd/system/niki-deploy.timer <<'TMREOF'
[Unit]
Description=Run niki-deploy every 2 minutes
[Timer]
OnBootSec=2min
OnUnitActiveSec=2min
[Install]
WantedBy=timers.target
TMREOF

systemctl daemon-reload
systemctl enable --now niki-deploy.timer
echo "[setup] deploy.sh + timer installed and ENABLED"
echo "First deploy runs within 2 min AFTER you (1) push to main and (2) add the deploy key to GitHub."
echo "Manual run / first deploy now:  sudo /opt/niki/deploy.sh --force"
echo "Logs:  journalctl -u niki-deploy.service -f"
