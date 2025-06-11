#!/bin/bash

# Exit on error
set -e

echo "Starting setup process..."

# Update system
echo "Updating system..."
sudo apt update && sudo apt upgrade -y

# Install required packages
echo "Installing required packages..."
sudo apt install -y nodejs python3.11 python3.11-venv nginx git

# Create application directory if it doesn't exist
echo "Setting up application directory..."
sudo mkdir -p /home/ubuntu/ideal-transportation
sudo chown -R ubuntu:ubuntu /home/ubuntu/ideal-transportation

# Create and configure Nginx
echo "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/ideal-transportation << 'EOF'
server {
    listen 80;
    server_name _;  # Accepts any hostname/IP

    # Frontend
    location / {
        root /home/ubuntu/ideal-transportation/src/out;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable Nginx site
echo "Enabling Nginx site..."
sudo ln -sf /etc/nginx/sites-available/ideal-transportation /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# Create Python virtual environment
echo "Setting up Python virtual environment..."
cd /home/ubuntu/ideal-transportation/backend
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Create systemd service for backend
echo "Creating systemd service..."
sudo tee /etc/systemd/system/ideal-transportation.service << 'EOF'
[Unit]
Description=Ideal Transportation Backend
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/ideal-transportation/backend
Environment="PATH=/home/ubuntu/ideal-transportation/backend/venv/bin"
Environment="DATABASE_URL=${DATABASE_URL}"
Environment="SECRET_KEY=${SECRET_KEY}"
ExecStart=/home/ubuntu/ideal-transportation/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd and enable service
echo "Enabling backend service..."
sudo systemctl daemon-reload
sudo systemctl enable ideal-transportation
sudo systemctl restart ideal-transportation

echo "Setup completed successfully!" 