#!/usr/bin/env bash
set -Eeuo pipefail

deploy_path="${NAS_DEPLOY_PATH:?NAS_DEPLOY_PATH is required}"
env_file="${ENV_FILE:-${deploy_path}/.env}"
compose_file="${COMPOSE_FILE:-${deploy_path}/compose.production.yaml}"

if [[ ! -f "${env_file}" ]]; then
  echo "Required production environment file is missing: ${env_file}" >&2
  exit 1
fi

if [[ ! -f "${compose_file}" ]]; then
  echo "Production Compose file is missing: ${compose_file}" >&2
  exit 1
fi

export ENV_FILE="${env_file}"
export COMPOSE_FILE="${compose_file}"

"$(dirname "$0")/backup-postgres.sh"
docker compose --env-file "${env_file}" -f "${compose_file}" run --rm app \
  node scripts/migrate.mjs
docker compose --env-file "${env_file}" -f "${compose_file}" up -d --no-build --remove-orphans
"$(dirname "$0")/health-check.sh"

docker compose --env-file "${env_file}" -f "${compose_file}" ps
echo "Production deployment completed after a successful readiness check."
