#!/bin/bash
# ================================================
# EasyCard Server Initial Setup Script
# Run this ONCE on a fresh server
# Server: 164.92.160.160 (ueasycard.com)
# ================================================

set -e

echo "=== EasyCard Server Setup ==="

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root: sudo bash setup-server.sh"
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
apt-get update
apt-get install -y git curl

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
    apt-get install -y docker-compose-plugin
fi

echo "Docker version: $(docker --version)"
echo "Docker Compose version: $(docker compose version)"

# Setup app directory
APP_DIR="/opt/easycard"

if [ -d "$APP_DIR/.git" ]; then
    echo "Git repo already exists in $APP_DIR"
else
    echo "Cloning repository..."
    rm -rf $APP_DIR
    git clone git@github.com:blobus01/easycarduae.git $APP_DIR
fi

cd $APP_DIR

# Check if .env exists
if [ ! -f "docker/.env" ]; then
    echo ""
    echo "WARNING: docker/.env file not found!"
    echo "Copy docker/.env.example to docker/.env and configure it:"
    echo "  cp docker/.env.example docker/.env"
    echo "  nano docker/.env"
    echo ""
    exit 1
fi

# Setup SSH key for GitHub Actions
SSH_DIR="/root/.ssh"
DEPLOY_KEY="$SSH_DIR/github_deploy_key"

if [ ! -f "$DEPLOY_KEY" ]; then
    echo ""
    echo "=== SSH Key Setup for GitHub Actions ==="
    echo ""
    echo "Generate a deploy key for GitHub Actions:"
    echo "  ssh-keygen -t ed25519 -C 'easycard-deploy' -f $DEPLOY_KEY -N ''"
    echo ""
    echo "Then:"
    echo "1. Add PUBLIC key to GitHub repo → Settings → Deploy keys"
    echo "   cat $DEPLOY_KEY.pub"
    echo ""
    echo "2. Add PRIVATE key to GitHub → Settings → Secrets → SSH_PRIVATE_KEY"
    echo "   cat $DEPLOY_KEY"
    echo ""
fi

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "1. Configure docker/.env with your secrets"
echo "2. Run: cd $APP_DIR/docker && docker compose up -d"
echo "3. Setup GitHub Secrets:"
echo "   - SERVER_HOST: 164.92.160.160"
echo "   - SERVER_USER: root"
echo "   - SSH_PRIVATE_KEY: (your deploy key)"
echo ""
