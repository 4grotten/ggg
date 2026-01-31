#!/bin/bash

# ================================================
# Easy Card - SSL Certificate Initialization Script
# Run this script once to obtain initial SSL certificates
# ================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if domain is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Domain name required${NC}"
    echo "Usage: ./init-ssl.sh your-domain.com [email@example.com]"
    exit 1
fi

DOMAIN=$1
EMAIL=${2:-"admin@$DOMAIN"}
DOCKER_COMPOSE_DIR=$(dirname "$0")/..

echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}  Easy Card SSL Certificate Setup${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "Domain: ${YELLOW}$DOMAIN${NC}"
echo -e "Email:  ${YELLOW}$EMAIL${NC}"
echo ""

# Create required directories
echo -e "${GREEN}[1/6] Creating directories...${NC}"
mkdir -p "$DOCKER_COMPOSE_DIR/certbot/conf"
mkdir -p "$DOCKER_COMPOSE_DIR/certbot/www"
mkdir -p "$DOCKER_COMPOSE_DIR/nginx/conf.d"

# Create dummy certificate for initial nginx startup
echo -e "${GREEN}[2/6] Creating temporary self-signed certificate...${NC}"
mkdir -p "$DOCKER_COMPOSE_DIR/certbot/conf/live/$DOMAIN"
docker run --rm -v "$DOCKER_COMPOSE_DIR/certbot/conf:/etc/letsencrypt" \
    alpine/openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout "/etc/letsencrypt/live/$DOMAIN/privkey.pem" \
    -out "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" \
    -subj "/CN=$DOMAIN" 2>/dev/null

# Create nginx config from template
echo -e "${GREEN}[3/6] Creating Nginx configuration...${NC}"
sed "s/YOUR_DOMAIN/$DOMAIN/g" "$DOCKER_COMPOSE_DIR/nginx/conf.d/easycard.conf.template" \
    > "$DOCKER_COMPOSE_DIR/nginx/conf.d/easycard.conf"

# Start nginx
echo -e "${GREEN}[4/6] Starting Nginx...${NC}"
cd "$DOCKER_COMPOSE_DIR"
docker compose up -d nginx

# Wait for nginx to start
sleep 5

# Delete dummy certificate
echo -e "${GREEN}[5/6] Requesting Let's Encrypt certificate...${NC}"
rm -rf "$DOCKER_COMPOSE_DIR/certbot/conf/live/$DOMAIN"
rm -rf "$DOCKER_COMPOSE_DIR/certbot/conf/archive/$DOMAIN"
rm -rf "$DOCKER_COMPOSE_DIR/certbot/conf/renewal/$DOMAIN.conf"

# Request real certificate
docker compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    --force-renewal \
    -d "$DOMAIN" \
    -d "www.$DOMAIN"

# Reload nginx with real certificate
echo -e "${GREEN}[6/6] Reloading Nginx with SSL certificate...${NC}"
docker compose exec nginx nginx -s reload

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}  SSL Setup Complete!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "Your site is now available at:"
echo -e "  ${YELLOW}https://$DOMAIN${NC}"
echo -e "  ${YELLOW}https://www.$DOMAIN${NC}"
echo ""
echo -e "Admin panels:"
echo -e "  pgAdmin:        ${YELLOW}https://$DOMAIN/pgadmin/${NC}"
echo -e "  Redis Commander: ${YELLOW}https://$DOMAIN/redis/${NC}"
echo ""
echo -e "Certificates will auto-renew via Certbot."
echo ""
