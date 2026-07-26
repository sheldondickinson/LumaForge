#!/usr/bin/env bash
set -Eeuo pipefail

compose_file="${COMPOSE_FILE:-compose.production.yaml}"
backup_root="${NAS_BACKUP_PATH:?NAS_BACKUP_PATH is required}/postgres"
timestamp="$(date -u +'%Y%m%dT%H%M%SZ')"
backup_file="${backup_root}/lumaforge-${timestamp}.dump.gz"

mkdir -p "${backup_root}"
umask 077

docker compose --env-file "${ENV_FILE:-.env}" -f "${compose_file}" exec -T postgres \
  pg_dump --format=custom --no-owner --no-privileges \
  --username="${POSTGRES_USER:?POSTGRES_USER is required}" \
  --dbname="${POSTGRES_DB:?POSTGRES_DB is required}" |
  gzip >"${backup_file}"

test -s "${backup_file}"
echo "PostgreSQL backup created: ${backup_file}"

if [[ -n "${BACKUP_RETENTION_DAYS:-}" ]]; then
  if [[ ! "${BACKUP_RETENTION_DAYS}" =~ ^[0-9]+$ ]]; then
    echo "BACKUP_RETENTION_DAYS must be a non-negative integer." >&2
    exit 1
  fi
  find "${backup_root}" -type f -name 'lumaforge-*.dump.gz' \
    -mtime "+${BACKUP_RETENTION_DAYS}" -print -delete
fi
