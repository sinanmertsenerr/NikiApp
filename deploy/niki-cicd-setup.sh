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
set -e
export GIT_SSH_COMMAND="ssh -i /opt/niki/deploy_key -o StrictHostKeyChecking=accept-new -o IdentitiesOnly=yes"
REPO="git@github.com:sinanmertsenerr/NikiApp.git"
APP=/opt/niki/app
FORCE="${1:-}"
if [ ! -d "$APP/.git" ]; then
  git clone "$REPO" "$APP"; CHANGED=1
else
  git -C "$APP" fetch --quiet origin main
  LOCAL=$(git -C "$APP" rev-parse HEAD); REMOTE=$(git -C "$APP" rev-parse origin/main)
  if [ "$LOCAL" != "$REMOTE" ]; then git -C "$APP" reset --hard origin/main; CHANGED=1; else CHANGED=0; fi
fi
if [ "${CHANGED:-0}" = "1" ] || [ "$FORCE" = "--force" ]; then
  cp /opt/niki/.env.production "$APP/backend/.env"
  cd "$APP/backend"
  docker compose up -d --build
  docker image prune -f
  echo "[deploy] done $(date -u)"
else
  echo "[deploy] no change $(date -u)"
fi
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
