#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: $ENV_FILE not found. Run: cp .env.example .env" >&2
  exit 1
fi
set -a
source "$ENV_FILE"
set +a

# ── Validate required vars ──────────────────────────────────────────────────
MISSING=()
[[ -z "${VITE_ARCGIS_CLIENT_ID:-}" ]] && MISSING+=("VITE_ARCGIS_CLIENT_ID")
[[ -z "${AZURE_ACR_NAME:-}" ]]        && MISSING+=("AZURE_ACR_NAME")
[[ -z "${AZURE_RESOURCE_GROUP:-}" ]]   && MISSING+=("AZURE_RESOURCE_GROUP")
[[ -z "${AZURE_APP_NAME:-}" ]]         && MISSING+=("AZURE_APP_NAME")

if [[ ${#MISSING[@]} -gt 0 ]]; then
  echo "ERROR: Missing required environment variables: ${MISSING[*]}" >&2
  exit 1
fi

# ── Defaults for optional vars ──────────────────────────────────────────────
VITE_PORTAL_URL="${VITE_PORTAL_URL:-https://www.arcgis.com}"
VITE_APP_TITLE="${VITE_APP_TITLE:-Agriculture Assistant}"
VITE_MAP_ITEM_ID="${VITE_MAP_ITEM_ID:-}"
VITE_CONFIG_ITEM_ID="${VITE_CONFIG_ITEM_ID:-}"

# ── Build & push ────────────────────────────────────────────────────────────
TAG="v$(date +%s)"
IMAGE="${AZURE_ACR_NAME}.azurecr.io/${AZURE_APP_NAME}:${TAG}"

echo "Building image: ${IMAGE}"
docker build --platform linux/amd64 \
  --build-arg VITE_ARCGIS_CLIENT_ID="$VITE_ARCGIS_CLIENT_ID" \
  --build-arg VITE_PORTAL_URL="$VITE_PORTAL_URL" \
  --build-arg VITE_APP_TITLE="$VITE_APP_TITLE" \
  --build-arg VITE_MAP_ITEM_ID="$VITE_MAP_ITEM_ID" \
  --build-arg VITE_CONFIG_ITEM_ID="$VITE_CONFIG_ITEM_ID" \
  -t "$IMAGE" .

echo "Logging in to ACR: ${AZURE_ACR_NAME}"
az acr login -n "$AZURE_ACR_NAME"

echo "Pushing image: ${IMAGE}"
docker push "$IMAGE"

echo "Updating container app: ${AZURE_APP_NAME}"
az containerapp update \
  -g "$AZURE_RESOURCE_GROUP" \
  -n "$AZURE_APP_NAME" \
  --image "$IMAGE"

FQDN=$(az containerapp show \
  -g "$AZURE_RESOURCE_GROUP" \
  -n "$AZURE_APP_NAME" \
  --query "properties.configuration.ingress.fqdn" -o tsv)

echo "Deployed successfully: https://${FQDN}"
