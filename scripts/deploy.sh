#!/bin/bash
set -e

REMOTE_USER="doug"
REMOTE_HOST="birdnetpi.local"
REMOTE_DIR="/home/doug/boltonisms"
CREDS_FILE="goat-jargon-file-b455b2682342.json"

echo "🚀 Deploying Boltonisms to production..."

# Check if credentials file exists
if [ ! -f "$CREDS_FILE" ]; then
  echo "❌ Error: Credentials file not found: $CREDS_FILE"
  exit 1
fi

# Create remote directory if it doesn't exist
echo "📁 Ensuring remote directory exists..."
ssh ${REMOTE_USER}@${REMOTE_HOST} "mkdir -p ${REMOTE_DIR}"

# Rsync code (exclude node_modules, dist, credentials)
echo "📦 Syncing code to production..."
rsync -avz --delete \
  --exclude 'node_modules/' \
  --exclude 'dist/' \
  --exclude '.git/' \
  --exclude "${CREDS_FILE}" \
  --exclude '.gitignore' \
  ./ ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/

# Copy credentials separately (won't be deleted by --delete flag)
echo "🔑 Copying credentials..."
scp ${CREDS_FILE} ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/${CREDS_FILE}

# Install dependencies on remote (need devDependencies for build tools)
echo "📚 Installing dependencies on remote..."
ssh ${REMOTE_USER}@${REMOTE_HOST} "cd ${REMOTE_DIR} && npm install"

# Run initial build
echo "🏗️  Running initial build on remote..."
ssh ${REMOTE_USER}@${REMOTE_HOST} "cd ${REMOTE_DIR} && npm run build"

# Copy and enable systemd services
echo "⚙️  Setting up systemd services..."
scp scripts/systemd/boltonisms.service ${REMOTE_USER}@${REMOTE_HOST}:/tmp/
scp scripts/systemd/boltonisms-build.service ${REMOTE_USER}@${REMOTE_HOST}:/tmp/
scp scripts/systemd/boltonisms-build.timer ${REMOTE_USER}@${REMOTE_HOST}:/tmp/

ssh ${REMOTE_USER}@${REMOTE_HOST} "sudo mv /tmp/boltonisms.service /etc/systemd/system/ && \
  sudo mv /tmp/boltonisms-build.service /etc/systemd/system/ && \
  sudo mv /tmp/boltonisms-build.timer /etc/systemd/system/ && \
  sudo systemctl daemon-reload && \
  sudo systemctl enable boltonisms.service && \
  sudo systemctl enable boltonisms-build.timer && \
  sudo systemctl restart boltonisms.service && \
  sudo systemctl start boltonisms-build.timer"

echo "✅ Deployment complete!"
echo ""
echo "🌐 Service should be running on http://birdnetpi.local:3000"
echo ""
echo "Useful commands:"
echo "  Check service status:  ssh ${REMOTE_USER}@${REMOTE_HOST} 'sudo systemctl status boltonisms'"
echo "  View logs:            ssh ${REMOTE_USER}@${REMOTE_HOST} 'sudo journalctl -u boltonisms -f'"
echo "  Check build timer:    ssh ${REMOTE_USER}@${REMOTE_HOST} 'sudo systemctl status boltonisms-build.timer'"
echo "  Manual rebuild:       ssh ${REMOTE_USER}@${REMOTE_HOST} 'cd ${REMOTE_DIR} && npm run build'"
