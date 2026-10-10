#!/usr/bin/env bash
# =====================================================================
# Oracle Always Free VM Setup Script for Shared Album
# =====================================================================
set -euo pipefail

echo "======================================================"
echo " Starting Oracle VM Environment Setup..."
echo "======================================================"

# 1. Update packages & install dependencies
sudo apt-get update -y
sudo apt-get install -y curl git ufw iptables-persistent

# 2. Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "[+] Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker "$USER"
    rm get-docker.sh
    echo "[+] Docker installed successfully."
fi

# 3. Install Docker Compose plugin if not present
if ! docker compose version &> /dev/null; then
    echo "[+] Installing Docker Compose..."
    sudo apt-get install -y docker-compose-plugin
fi

# 4. Create persistent volume directories
echo "[+] Creating persistent database and storage directories..."
sudo mkdir -p /opt/shared-album/{database,uploads,logs,backups}
sudo chown -R "$USER":"$USER" /opt/shared-album

# 5. Configure firewall (ports 80 & 443)
echo "[+] Opening HTTP (80) and HTTPS (443) firewall ports..."
if command -v ufw &> /dev/null; then
    sudo ufw allow 80/tcp || true
    sudo ufw allow 443/tcp || true
fi

# Oracle Cloud iptables rule flush for HTTP/HTTPS
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT || true
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT || true
sudo netfilter-persistent save || true

echo "======================================================"
echo " Setup complete! Next steps:"
echo " 1. Copy environment file: cp .env.example .env"
echo " 2. Fill in your credentials: nano .env"
echo " 3. Launch stack: docker compose up -d"
echo "======================================================"
