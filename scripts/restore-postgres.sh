#!/usr/bin/env bash
set -Eeuo pipefail

if [[ "$#" -ne 1 ]]; then
  echo "Usage: $0 <postgres-backup.dump.gz>" >&2
  exit 1
fi

backup_file="$1"
compose_file="${COMPOSE_FILE:-compose.production.yaml}"

if [[ ! -f "${backup_file}" || ! -s "${backup_file}" ]]; then
  echo "Backup file is missing or empty: ${backup_file}" >&2
  exit 1
fi

echo "This will replace data in database '${POSTGRES_DB:?POSTGRES_DB is required}'."
read -r -p "Type RESTORE ${POSTGRES_DB} to continue: " confirmation

if [[ "${confirmation}" != "RESTORE ${POSTGRES_DB}" ]]; then
  echo "Restore cancelled."
  exit 1
fi

gzip -dc -- "${backup_file}" |
  docker compose --env-file "${ENV_FILE:-.env}" -f "${compose_file}" exec -T postgres \
    pg_restore --clean --if-exists --no-owner --no-privileges \
    --username="${POSTGRES_USER:?POSTGRES_USER is required}" \
    --dbname="${POSTGRES_DB}"

echo "Restore command completed. Run application and data verification before use."
