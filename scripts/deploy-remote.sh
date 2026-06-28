#!/usr/bin/env bash

set -euo pipefail

# Deploy the current repo to a remote host, then run update-site.sh there.
#
# Optional:
#   DEPLOY_HOST=185.200.66.124
#   DEPLOY_USER=root
#   DEPLOY_PATH=/root/Taichi-site
#   SSH_KEY_PATH=/root/.ssh/id_ed25519
#   SSH_PORT=22
#
# Example:
#   ./scripts/deploy-remote.sh
#   DEPLOY_USER=root SSH_KEY_PATH=/root/.ssh/id_ed25519 ./scripts/deploy-remote.sh

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"

DEPLOY_HOST="${DEPLOY_HOST:-185.200.66.124}"
DEPLOY_USER="${DEPLOY_USER:-root}"
DEPLOY_PATH="${DEPLOY_PATH:-/root/Taichi-site}"
SSH_KEY_PATH="${SSH_KEY_PATH:-}"
SSH_PORT="${SSH_PORT:-22}"

SSH_ARGS=(
  -p "$SSH_PORT"
  -o StrictHostKeyChecking=accept-new
  -o ConnectTimeout=10
)

if [[ -n "$SSH_KEY_PATH" ]]; then
  SSH_ARGS+=(-i "$SSH_KEY_PATH")
fi

RSYNC_SSH=(ssh "${SSH_ARGS[@]}")

echo "🚀 Deploying Taichi site to ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}"

ssh "${SSH_ARGS[@]}" "${DEPLOY_USER}@${DEPLOY_HOST}" "mkdir -p '${DEPLOY_PATH}'"

rsync -az --delete \
  --exclude ".git/" \
  --exclude ".next/" \
  --exclude "node_modules/" \
  --exclude "logs/" \
  --exclude ".env.local" \
  -e "${RSYNC_SSH[*]}" \
  "${PROJECT_ROOT}/" "${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/"

ssh "${SSH_ARGS[@]}" "${DEPLOY_USER}@${DEPLOY_HOST}" \
  "cd '${DEPLOY_PATH}' && chmod +x update-site.sh && ./update-site.sh"

echo "✅ Remote deployment complete"
