# Deployment Guide

## Quick Deploy

```bash
npm run deploy
```

## What Happens

1. **Code Sync** - Rsyncs all code to `doug@birdnetpi.local:/home/doug/boltonisms`
2. **Credentials** - Securely copies `goat-jargon-file-b455b2682342.json`
3. **Dependencies** - Runs `npm install --production` on remote
4. **Initial Build** - Runs `npm run build` to pull Google Sheets data
5. **Systemd Setup** - Installs and starts these services:

### Services Created

#### boltonisms.service
- Runs the web server on port 3000
- Auto-restarts if it crashes
- Auto-starts on reboot
- Logs to systemd journal

#### boltonisms-build.timer
- Triggers `npm run build` every hour
- Runs 5 minutes after boot
- Ensures sheet data stays fresh

## Troubleshooting

### Service won't start
```bash
ssh doug@birdnetpi.local 'sudo journalctl -u boltonisms -n 50'
```

### Build timer not running
```bash
ssh doug@birdnetpi.local 'sudo systemctl list-timers | grep boltonisms'
```

### Manually rebuild data
```bash
ssh doug@birdnetpi.local 'cd /home/doug/boltonisms && npm run build'
```

### Restart everything
```bash
ssh doug@birdnetpi.local 'sudo systemctl restart boltonisms && sudo systemctl restart boltonisms-build.timer'
```

## First-Time Setup Notes

The deploy script handles everything automatically, but if you need to manually set up:

1. Ensure Node.js is installed on the remote server
2. Ensure systemd is available (standard on most Linux systems)
3. Ensure the user `doug` has sudo permissions for systemctl commands

## Security Notes

- Credentials file is copied separately and NOT added to git
- Only production dependencies are installed on remote
- Service runs as user `doug` (not root)
