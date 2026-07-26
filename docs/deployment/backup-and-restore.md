# Backup and restore

## Backup

`scripts/backup-postgres.sh` creates a timestamped compressed PostgreSQL logical backup outside the active data volume. `BACKUP_RETENTION_DAYS` is optional; no backup is deleted when it is unset.

Attachment data must also be copied to independent backup storage using a NAS-appropriate, verified tool. Do not treat a database dump as an attachment backup.

## Restore

`scripts/restore-postgres.sh <backup-file>` validates the path and requires the operator to type a confirmation phrase. Restore into an isolated test database first, then verify migrations, row counts, application readiness, and representative records.

A backup is not verified until restoration has succeeded and the restored application state has been checked. The repository bootstrap does not claim this has occurred.

## Future work

Add an automated scheduled restore test after the NAS and backup destination are selected.
