#!/usr/bin/env bash
# Deploy the gig-escrow contract to Stellar testnet.
set -euo pipefail

IDENTITY="${1:-workshop}"
NETWORK="testnet"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WASM="target/wasm32v1-none/release/gig_escrow.wasm"
ENV_FILE="$ROOT/web/.env.local"

cd "$ROOT"

# 1. Ensure a funded testnet identity exists
if ! stellar keys ls | grep -qx "$IDENTITY"; then
  echo "Creating + funding testnet identity '$IDENTITY'..."
  stellar keys generate "$IDENTITY" --network "$NETWORK" --fund
fi

# 2. Build the contract to wasm
echo "Building contract..."
stellar contract build

# 3. Deploy to testnet
echo "Deploying to $NETWORK..."
CONTRACT_ID=$(stellar contract deploy \
  --wasm "$WASM" \
  --source-account "$IDENTITY" \
  --network "$NETWORK")
echo "Deployed contract ID: $CONTRACT_ID"

# 4. Write NEXT_PUBLIC_GIG_CONTRACT_ID into web/.env.local
if [ -f "$ENV_FILE" ]; then
  grep -v '^NEXT_PUBLIC_GIG_CONTRACT_ID=' "$ENV_FILE" > "$ENV_FILE.tmp" || true
  mv "$ENV_FILE.tmp" "$ENV_FILE"
fi
echo "NEXT_PUBLIC_GIG_CONTRACT_ID=$CONTRACT_ID" >> "$ENV_FILE"
echo ""
echo "Wrote NEXT_PUBLIC_GIG_CONTRACT_ID=$CONTRACT_ID to web/.env.local"
echo "Restart 'npm run dev' to pick up the new contract ID."
