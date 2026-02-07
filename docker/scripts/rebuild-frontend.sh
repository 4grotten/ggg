#!/bin/bash
# ================================================
# Quick rebuild script for EasyCard frontend
# Use when you need to manually trigger a rebuild
# ================================================

set -e

cd /opt/easycard

echo "=== Pulling latest changes ==="
git fetch origin main
git reset --hard origin/main

echo ""
echo "=== Rebuilding frontend ==="
cd docker
docker compose build easycard-app

echo ""
echo "=== Restarting frontend ==="
docker compose up -d easycard-app

echo ""
echo "=== Status ==="
docker compose ps easycard-app

echo ""
echo "Done! Check https://ueasycard.com"
