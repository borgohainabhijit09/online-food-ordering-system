#!/bin/bash
cd /home/ubuntu
mkdir -p app
tar -xzf app-source.tar.gz -C app
cd app

# Modify docker-compose.yml for VPS
# Remove external: true from pgdata
sed -i '/pgdata:/,+2d' docker-compose.yml
echo '  pgdata:' >> docker-compose.yml
echo '  redisdata:' >> docker-compose.yml

# Change frontend build arg NEXT_PUBLIC_API_URL to the real domain
sed -i 's|http://localhost:8090|https://restobuddy.in|g' docker-compose.yml

# Change nginx ports to 80 and 443
sed -i 's/- "8090:80"/- "80:80"\n      - "443:443"/g' docker-compose.yml

# We will need to map a volume for certbot in nginx
sed -i 's|- ./docker/nginx/default.conf:/etc/nginx/conf.d/default.conf:ro|- ./docker/nginx/default.conf:/etc/nginx/conf.d/default.conf:ro\n      - ./certbot/conf:/etc/letsencrypt\n      - ./certbot/www:/var/www/certbot|g' docker-compose.yml

# Add certbot service to docker-compose.yml
cat << 'EOF' >> docker-compose.yml

  certbot:
    image: certbot/certbot
    container_name: certbot
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    command: certonly --webroot -w /var/www/certbot --force-renewal --email admin@restobuddy.in -d restobuddy.in -d www.restobuddy.in --agree-tos
EOF

# Update nginx default.conf to handle HTTP and HTTPS
cat << 'EOF' > docker/nginx/default.conf
server {
    listen 80;
    server_name restobuddy.in www.restobuddy.in;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name restobuddy.in www.restobuddy.in;

    ssl_certificate /etc/letsencrypt/live/restobuddy.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/restobuddy.in/privkey.pem;

    location / {
        proxy_pass http://frontend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        proxy_pass http://backend:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Before starting certbot for the first time, we need a dummy cert so nginx doesn't crash on startup.
mkdir -p certbot/conf/live/restobuddy.in
curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > certbot/conf/options-ssl-nginx.conf
curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > certbot/conf/ssl-dhparams.pem
openssl req -x509 -nodes -newkey rsa:2048 -days 1 -keyout certbot/conf/live/restobuddy.in/privkey.pem -out certbot/conf/live/restobuddy.in/fullchain.pem -subj '/CN=localhost'

echo 'SETUP SCRIPT COMPLETE'
