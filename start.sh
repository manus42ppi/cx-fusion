#!/bin/bash
# CX Fusion – Lokaler Dev-Server
# Starten: bash /Users/mas/DEV/cx-fusion/start.sh

echo "🚀 CX Fusion startet..."
echo "   Lokal:  http://localhost:5174"
echo "   Live:   https://cx-fusion.pages.dev (nach Cloudflare-Setup)"
echo ""

cd /Users/mas/DEV/cx-fusion

# API-Server im Hintergrund starten (Port 8788)
echo "▶ API-Server (Port 8788)..."
/usr/local/bin/node local-server.js &
API_PID=$!
sleep 1

# Vite Dev-Server starten (Port 5174)
echo "▶ Vite Dev-Server (Port 5174)..."
/usr/local/bin/node node_modules/vite/bin/vite.js --port 5174

# Beim Beenden auch API-Server stoppen
kill $API_PID 2>/dev/null
