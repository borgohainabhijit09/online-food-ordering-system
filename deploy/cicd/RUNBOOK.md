# CI/CD + subdomains runbook — Jenkins & Adminer for restobuddy.in

Sets up:
- **jenkins.restobuddy.in** → Jenkins (auto-deploys `main` on push)
- **db.restobuddy.in** → Adminer (Basic-Auth protected)

Everything runs in the existing `food-ordering-cell` compose stack on the server.
DNS for both subdomains already points at the server. Run all server commands from
`ssh resto-server`, in `/root/app`.

> These are the exact files in this folder:
> - `jenkins.Dockerfile` → copy to `/root/app/docker/jenkins/Dockerfile`
> - `nginx-default.conf` → replaces `/root/app/docker/nginx/default.conf`
> - `../../Jenkinsfile` (repo root) → already in the repo `main` branch

---

## 0. Cloudflare (dashboard — you do this)

1. **DNS**: confirm `jenkins` and `db` A-records → `95.111.229.39`, **Proxied (orange)**. (Already resolving.)
2. **Origin Certificate** (SSL/TLS → Origin Server → Create Certificate):
   - Hostnames: `restobuddy.in`, `*.restobuddy.in`
   - Save the **certificate** and **private key**.
3. **SSL/TLS mode**: set to **Full (strict)** (the app already has a valid cert; the origin cert covers the subdomains).

---

## 1. Put the Cloudflare origin cert on the server

```bash
mkdir -p /root/app/docker/nginx/certs
nano /root/app/docker/nginx/certs/restobuddy-origin.pem   # paste the CERTIFICATE
nano /root/app/docker/nginx/certs/restobuddy-origin.key   # paste the PRIVATE KEY
chmod 600 /root/app/docker/nginx/certs/restobuddy-origin.key
```

## 2. Create the Adminer Basic-Auth user

```bash
# generate htpasswd (uses the httpd image so you don't need apache-utils installed)
docker run --rm httpd:2.4-alpine htpasswd -nbB admin 'CHOOSE_A_STRONG_PASSWORD' \
  > /root/app/docker/nginx/.htpasswd
cat /root/app/docker/nginx/.htpasswd    # should show  admin:$2y$...
```

## 3. Add the Jenkins image + files

```bash
mkdir -p /root/app/docker/jenkins
# paste jenkins.Dockerfile contents into:
nano /root/app/docker/jenkins/Dockerfile
# replace the nginx vhost with the new one (app + jenkins + db):
nano /root/app/docker/nginx/default.conf
```
(Or `git pull` on the server once these files are committed to `main`, then just create
the cert/htpasswd from steps 1–2.)

## 4. Edit `/root/app/docker-compose.yml`

**4a. Add mounts to the `nginx` service** (under its existing `volumes:`):
```yaml
      - ./docker/nginx/.htpasswd:/etc/nginx/.htpasswd:ro
      - ./docker/nginx/certs:/etc/nginx/certs:ro
```

**4b. Add the `jenkins` service** (top-level, alongside the others):
```yaml
  jenkins:
    build:
      context: ./docker/jenkins
    container_name: food_ordering_jenkins
    restart: unless-stopped
    user: root                       # needs the docker socket
    environment:
      JENKINS_OPTS: "--prefix="
    volumes:
      - jenkins_home:/var/jenkins_home
      - /var/run/docker.sock:/var/run/docker.sock
      - /root/app:/workspace/app     # deploy dir (git pull + compose build happen here)
    # no host port — nginx proxies jenkins.restobuddy.in -> jenkins:8080
```

**4c. Add the named volume** (under top-level `volumes:`):
```yaml
  jenkins_home:
```

## 5. Bring it up

```bash
cd /root/app
docker compose up -d --build jenkins      # builds Jenkins image, starts it
docker compose up -d                       # applies nginx mount changes (recreates nginx)
docker exec food_ordering_nginx nginx -t && docker exec food_ordering_nginx nginx -s reload
```

Verify:
```bash
curl -sI https://jenkins.restobuddy.in | head -1     # expect 200/403 (Jenkins login)
curl -sI https://db.restobuddy.in | head -1          # expect 401 (Basic Auth prompt)
```

## 6. Jenkins first-time setup

```bash
# initial admin password:
docker exec food_ordering_jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```
1. Open **https://jenkins.restobuddy.in**, paste the password.
2. "Install suggested plugins" (git/github/pipeline already baked in).
3. Create the admin user.

### 6a. Add the GitHub deploy key as a Jenkins SSH credential

Jenkins runs in its own container and does **not** see `/root/.ssh/github_deploy`,
so register the key inside Jenkins. Print the PRIVATE key on the host:
```bash
cat /root/.ssh/github_deploy
```
In Jenkins UI: **Manage Jenkins → Credentials → System → Global → Add Credentials**
- **Kind:** *SSH Username with private key*
- **ID:** `github-deploy`
- **Username:** `git`
- **Private Key:** *Enter directly* → paste the contents of `github_deploy`
- Save.

### 6b. Create the pipeline job

**New Item → Pipeline** named `restobuddy-deploy`:
- **Pipeline → Definition:** *Pipeline script from SCM*
- **SCM:** Git
  - **Repository URL:** `git@github.com:borgohainabhijit09/online-food-ordering-system.git`  ← SSH, not HTTPS
  - **Credentials:** select `github-deploy` (the SSH key from 6a)
- **Branch:** `*/main`
- **Script Path:** `Jenkinsfile`
- Save → **Build Now** to test.

> The deploy key is **read-only** — fine, because Jenkins only *pulls*. The
> Jenkinsfile's `git reset --hard origin/main` runs inside the mounted `/root/app`,
> whose origin is already the SSH remote.

## 7. Auto-trigger on push (GitHub webhook)

- GitHub repo → **Settings → Webhooks → Add**:
  - Payload URL: `https://jenkins.restobuddy.in/github-webhook/`
  - Content type: `application/json`
  - Events: *Just the push event*
- In the Jenkins job, enable **Build Triggers → GitHub hook trigger for GITScm polling**.
- (The Jenkinsfile also has `pollSCM('H/5 * * * *')` as a fallback if the webhook fails.)

---

## Security notes (important)

- **Jenkins runs as root with the Docker socket** = effectively root on the host. That's
  normal for a single-owner CI box, but keep Jenkins locked down: strong admin password,
  no anonymous access, keep it behind Cloudflare. Consider **Cloudflare Access** on
  `jenkins.` and `db.` for a second auth layer.
- **Adminer** is now public (Basic-Auth only). Use a long random password. Postgres itself
  is still localhost-bound, so Adminer is the only path in — keep it gated.
- **Rotate `JWT_SECRET` and the Postgres password** (still the committed defaults) — the
  app is publicly live. Do this as a follow-up.
- UFW currently allows only 22/80/443; Jenkins/Adminer are reached via nginx on 443, so no
  new ports are opened. Good.

## Rollback
- Restore the previous nginx vhost: `cp docker-compose.yml.bak-* docker-compose.yml` isn't
  needed for nginx; just `git checkout docker/nginx/default.conf` (or your backup) and
  `nginx -s reload`.
- Remove Jenkins: `docker compose rm -sf jenkins` (keeps `jenkins_home` volume).
