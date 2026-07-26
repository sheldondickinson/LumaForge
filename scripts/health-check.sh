#!/usr/bin/env bash
set -Eeuo pipefail

health_url="${HEALTH_URL:?HEALTH_URL is required}"
attempts="${HEALTH_CHECK_ATTEMPTS:-20}"
delay_seconds="${HEALTH_CHECK_DELAY_SECONDS:-5}"

for ((attempt = 1; attempt <= attempts; attempt += 1)); do
  if curl --fail --silent --show-error --max-time 10 "${health_url}" >/dev/null; then
    echo "LumaForge readiness check passed."
    exit 0
  fi

  echo "Readiness attempt ${attempt}/${attempts} failed." >&2
  sleep "${delay_seconds}"
done

echo "LumaForge did not become ready." >&2
exit 1
