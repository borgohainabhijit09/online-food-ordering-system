#!/usr/bin/env bash
# =============================================================================
#  One-shot server-side setup for Jenkins CI/CD + jenkins./db. subdomains.
#  Idempotent and safe: it validates the nginx config OFFLINE before touching
#  the running nginx, so a bad cert can't take the live site down.
#
#  Run on the server:   ssh resto-server   then:
#     cd /root/app && git pull origin main && bash deploy/cicd/setup.sh
#
#  Prereqs you must do first (dashboard):
#    - Cloudflare Origin Certificate for  restobuddy.in, *.restobuddy.in
#    - Cloudflare SSL/TLS mode = Full (strict)
#    - jenkins. and db. DNS = proxied (orange)  [already resolving]
# =============================================================================
set -euo pipefail
cd /root/app

echo "==> [1/6] Installing production nginx vhost + Jenkins image files"
mkdir -p docker/nginx/certs docker/jenkins
cp deploy/cicd/nginx-default.conf docker/nginx/default.conf
cp deploy/cicd/jenkins.Dockerfile docker/jenkins/Dockerfile

echo "==> [2/6] Cloudflare Origin certificate"
PEM=docker/nginx/certs/restobuddy-origin.pem
KEY=docker/nginx/certs/restobuddy-origin.key
if [ ! -s "$PEM" ] || [ ! -s "$KEY" ]; then
  echo "    Paste the Cloudflare Origin CERTIFICATE, then press Ctrl-D:"
  cat > "$PEM"
  echo "    Paste the Cloudflare Origin PRIVATE KEY, then press Ctrl-D:"
  cat > "$KEY"
  chmod 600 "$KEY"
else
  echo "    cert already present — skipping"
fi

echo "==> [3/6] Adminer Basic-Auth (db.restobuddy.in)"
if [ ! -s docker/nginx/.htpasswd ]; then
  read -rp "    Adminer username [admin]: " AU; AU=${AU:-admin}
  read -rsp "    Adminer password: " AP; echo
  docker run --rm httpd:2.4-alpine htpasswd -nbB "$AU" "$AP" > docker/nginx/.htpasswd
  echo "    .htpasswd created for user '$AU'"
else
  echo "    .htpasswd already present — skipping"
fi

echo "==> [4/6] Writing docker-compose.override.yml (auto-merged by 'docker compose')"
cat > docker-compose.override.yml <<'YAML'
# Auto-merged with docker-compose.yml. Adds Jenkins + mounts the Basic-Auth
# file and origin certs into nginx. Kept separate so the base compose (and the
# Jenkinsfile's `docker compose up -d`) stay clean.
services:
  nginx:
    volumes:
      - ./docker/nginx/.htpasswd:/etc/nginx/.htpasswd:ro
      - ./docker/nginx/certs:/etc/nginx/certs:ro

  jenkins:
    build:
      context: ./docker/jenkins
    container_name: food_ordering_jenkins
    restart: unless-stopped
    user: root                       # needs the mounted docker socket
    environment:
      JENKINS_OPTS: "--prefix="
    volumes:
      - jenkins_home:/var/jenkins_home
      - /var/run/docker.sock:/var/run/docker.sock
      - /root/app:/workspace/app

volumes:
  jenkins_home:
YAML

echo "==> [5/6] Validating nginx config OFFLINE (won't touch live site if invalid)"
docker run --rm \
  -v "$PWD/docker/nginx/default.conf:/etc/nginx/conf.d/default.conf:ro" \
  -v "$PWD/docker/nginx/certs:/etc/nginx/certs:ro" \
  -v "$PWD/docker/nginx/.htpasswd:/etc/nginx/.htpasswd:ro" \
  -v "$PWD/certbot/conf:/etc/letsencrypt:ro" \
  nginx:alpine nginx -t
echo "    nginx config OK"

echo "==> [6/6] Building Jenkins and applying"
docker compose up -d --build jenkins
docker compose up -d                       # applies nginx override mounts + new vhost
docker exec food_ordering_nginx nginx -t && docker exec food_ordering_nginx nginx -s reload

echo
echo "================= DONE ================="
echo "Jenkins initial admin password:"
sleep 6
docker exec food_ordering_jenkins cat /var/jenkins_home/secrets/initialAdminPassword 2>/dev/null \
  || echo "(not ready yet — run: docker exec food_ordering_jenkins cat /var/jenkins_home/secrets/initialAdminPassword)"
echo
echo "Next: open https://jenkins.restobuddy.in  and follow RUNBOOK section 6."
echo "Check: curl -sI https://db.restobuddy.in | head -1   # expect 401 (Basic Auth)"
