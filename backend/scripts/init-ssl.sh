#!/bin/bash

# ===========================================
# SSL Certificate Init Script for Niki API
# Domain: api.niki.ieu.app
# ===========================================
# Usage: ./scripts/init-ssl.sh your@email.com

set -e

DOMAIN="api.niki.ieu.app"
EMAIL=$1

if [ -z "$EMAIL" ]; then
    echo "Usage: ./scripts/init-ssl.sh <email>"
    echo "Example: ./scripts/init-ssl.sh admin@ieu.app"
    exit 1
fi

echo "=========================================="
echo "Setting up SSL for: $DOMAIN"
echo "Email: $EMAIL"
echo "=========================================="

# Create directories
mkdir -p ./certbot/conf
mkdir -p ./certbot/www
mkdir -p ./nginx/conf.d

echo "Step 1: Creating temporary nginx config for certificate..."

# Create temporary nginx config (HTTP only for initial cert)
cat > ./nginx/conf.d/temp.conf << EOF
server {
    listen 80;
    server_name $DOMAIN;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 'Waiting for SSL setup...';
        add_header Content-Type text/plain;
    }
}
EOF

echo "Step 2: Starting nginx..."
docker-compose -f docker-compose.prod.yml up -d nginx

echo "Step 3: Requesting SSL certificate..."
docker-compose -f docker-compose.prod.yml run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN

echo "Step 4: Removing temporary config..."
rm -f ./nginx/conf.d/temp.conf

echo "Step 5: Restarting nginx with SSL..."
docker-compose -f docker-compose.prod.yml restart nginx

echo "=========================================="
echo "SSL setup complete!"
echo "Your API is now available at: https://$DOMAIN"
echo "=========================================="
