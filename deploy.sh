#!/usr/bin/env bash
# Build and start Solve For Sakthi on this server, then print the addresses to open.
#   ./deploy.sh
# The app listens on every address of the server; no IP needs to be configured anywhere.
set -euo pipefail
cd "$(dirname "$0")"

docker compose up -d --build

echo "Waiting for the backend to become healthy..."
for _ in $(seq 1 60); do
  if curl -sf http://localhost:9022/health >/dev/null 2>&1; then break; fi
  sleep 3
done
curl -sf http://localhost:9022/health >/dev/null 2>&1 || { echo "Backend is not healthy yet, check: docker compose logs backend"; exit 1; }

echo
echo "Solve For Sakthi is running. Open it on any of this server's addresses:"
# the server's own IPv4 addresses (Docker's internal bridge networks left out)
for ip in $(ip -4 -o addr show scope global 2>/dev/null | awk '$2 !~ /^(docker|br-|veth)/ {split($4, a, "/"); print a[1]}'); do
  echo "  Frontend: http://$ip:9021      Backend: http://$ip:9022"
done
public_ip=$(curl -4 -s --max-time 3 https://ifconfig.me 2>/dev/null || true)
if [ -n "$public_ip" ]; then
  echo "  Public:   http://$public_ip:9021   (reachable if the firewall / security group allows 9021)"
fi
echo
echo "If a page does not open from another machine, allow the ports in the firewall:"
echo "  sudo ufw allow 9021/tcp && sudo ufw allow 9022/tcp"
