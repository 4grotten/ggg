#!/bin/bash
# ================================================
# EasyCard Supabase Self-Hosted Deployment Script
# Server: 164.92.160.160 (easycarduae.com)
# ================================================

set -e

echo "=== EasyCard Deployment Script ==="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root: sudo bash deploy.sh"
    exit 1
fi

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi

# Install Docker Compose plugin if not present
if ! docker compose version &> /dev/null; then
    echo "Installing Docker Compose..."
    apt-get update
    apt-get install -y docker-compose-plugin
fi

echo "Docker version: $(docker --version)"
echo "Docker Compose version: $(docker compose version)"

# Create app directory
APP_DIR="/opt/easycard"
mkdir -p $APP_DIR
cd $APP_DIR

echo ""
echo "=== Stopping existing containers (if any) ==="
docker compose down 2>/dev/null || true

echo ""
echo "=== Starting EasyCard stack ==="
docker compose pull
docker compose up -d

echo ""
echo "=== Waiting for services to start ==="
sleep 10

echo ""
echo "=== Container Status ==="
docker compose ps

echo ""
echo "=== Setting up SSL with Let's Encrypt ==="
# Initialize SSL certificates
if [ ! -f "./certbot/conf/live/easycarduae.com/fullchain.pem" ]; then
    echo "Obtaining SSL certificate..."
    docker compose run --rm certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        -d easycarduae.com \
        -d www.easycarduae.com \
        -d api.easycarduae.com \
        --email admin@easycarduae.com \
        --agree-tos \
        --no-eff-email \
        --force-renewal || echo "SSL setup will need to be done manually"
fi

echo ""
echo "=== Configuring Firewall ==="
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp
# Allow PostgreSQL from Apofiz server (apofiz.com)
ufw allow from 164.90.233.85 to any port 5432 comment "Apofiz PostgreSQL access"
ufw --force enable
ufw status

echo ""
echo "=== Opening PostgreSQL for external access ==="
# Update PostgreSQL to listen on all interfaces
docker exec easycard_db psql -U easycard -c "ALTER SYSTEM SET listen_addresses = '*';"
# Add pg_hba entry for Apofiz server
docker exec easycard_db bash -c "echo 'host all all 164.90.233.85/32 md5' >> /var/lib/postgresql/data/pg_hba.conf"
docker restart easycard_db

echo ""
echo "=== Deployment Complete ==="
echo ""
echo "Services available at:"
echo "  - Frontend: https://easycarduae.com"
echo "  - API: https://api.easycarduae.com/rest/v1/"
echo "  - Auth: https://api.easycarduae.com/auth/v1/"
echo "  - Studio: https://api.easycarduae.com/studio/"
echo "  - pgAdmin: https://easycarduae.com/pgadmin/"
echo ""
echo "PostgreSQL credentials:"
echo "  - Host: 164.92.160.160"
echo "  - Port: 5432"
echo "  - Database: easycard"
echo "  - User: easycard"
echo "  - Password: (see .env file)"
echo ""
