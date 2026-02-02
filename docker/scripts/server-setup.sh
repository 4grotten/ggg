#!/bin/bash

# ================================================
# EasyCard UAE - Server Initial Setup Script
# Run this script ONCE on a fresh DigitalOcean Droplet
# ================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}  EasyCard UAE - Server Setup${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Error: Please run as root (sudo)${NC}"
    exit 1
fi

# 1. Update system
echo -e "${GREEN}[1/6] Updating system packages...${NC}"
apt update && apt upgrade -y

# 2. Install Docker
echo -e "${GREEN}[2/6] Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    echo -e "${GREEN}Docker installed successfully${NC}"
else
    echo -e "${YELLOW}Docker already installed${NC}"
fi

# 3. Install Docker Compose plugin
echo -e "${GREEN}[3/6] Installing Docker Compose...${NC}"
if ! docker compose version &> /dev/null; then
    apt install -y docker-compose-plugin
    echo -e "${GREEN}Docker Compose installed successfully${NC}"
else
    echo -e "${YELLOW}Docker Compose already installed${NC}"
fi

# 4. Configure firewall
echo -e "${GREEN}[4/6] Configuring firewall (UFW)...${NC}"
apt install -y ufw

# Allow SSH (important - don't lock yourself out!)
ufw allow 22/tcp comment 'SSH'

# Allow HTTP/HTTPS
ufw allow 80/tcp comment 'HTTP'
ufw allow 443/tcp comment 'HTTPS'

# Enable firewall
ufw --force enable
echo -e "${GREEN}Firewall configured${NC}"

# 5. Create application directory
echo -e "${GREEN}[5/6] Creating application directory...${NC}"
APP_DIR="/opt/easycard"
mkdir -p $APP_DIR
cd $APP_DIR

echo -e "${GREEN}Application directory: $APP_DIR${NC}"

# 6. Install additional tools
echo -e "${GREEN}[6/6] Installing additional tools...${NC}"
apt install -y \
    htop \
    curl \
    wget \
    git \
    vim \
    nano \
    net-tools

# Print next steps
echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}  Server Setup Complete!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "Next steps:"
echo -e ""
echo -e "1. ${YELLOW}Copy project files to server:${NC}"
echo -e "   scp -r docker/* root@YOUR_SERVER_IP:/opt/easycard/"
echo -e ""
echo -e "2. ${YELLOW}Configure environment:${NC}"
echo -e "   cd /opt/easycard"
echo -e "   cp .env.example .env"
echo -e "   nano .env  # Edit passwords and domain!"
echo -e ""
echo -e "3. ${YELLOW}Point DNS to this server:${NC}"
echo -e "   Create A record: easycarduae.com → $(curl -s ifconfig.me)"
echo -e "   Create A record: www.easycarduae.com → $(curl -s ifconfig.me)"
echo -e ""
echo -e "4. ${YELLOW}Get SSL certificate and start services:${NC}"
echo -e "   chmod +x scripts/init-ssl.sh"
echo -e "   ./scripts/init-ssl.sh easycarduae.com admin@easycarduae.com"
echo -e ""
echo -e "5. ${YELLOW}Start all services:${NC}"
echo -e "   docker compose up -d"
echo -e ""
echo -e "${GREEN}Server IP: $(curl -s ifconfig.me)${NC}"
echo ""
