# NAS deployment architecture

## Preferred path

```text
GitHub repository
→ manually dispatched GitHub Actions workflow
→ self-hosted NAS runner
→ pre-migration backup
→ explicit migration
→ Docker Compose deployment
→ verified health checks
```

The runner must carry `self-hosted`, `linux`, `lumaforge`, and `production` labels and use a protected GitHub `production` environment. This avoids publishing the Docker socket or SSH service. Production secrets remain in a restrictive NAS `.env` file and are not copied into GitHub.

Recommended layout:

```text
<NAS_DEPLOY_PATH>/lumaforge/
├── compose.production.yaml
├── .env
├── data/
│   ├── postgres/
│   └── attachments/
├── backups/
│   ├── postgres/
│   └── attachments/
└── logs/
```

Set `NAS_DEPLOY_PATH`, `NAS_DATA_PATH`, and `NAS_BACKUP_PATH` on the runner. Persistent data stays separate from the checked-out source where practical.

## First administrator

After the first reviewed deployment and migration, create the administrator from an interactive shell on the NAS runner or deployment host:

```bash
docker compose --env-file <NAS_DEPLOY_PATH>/lumaforge/.env \
  -f <NAS_DEPLOY_PATH>/lumaforge/compose.production.yaml \
  run --rm app node scripts/create-administrator.mjs --email you@example.com
```

The command prompts twice without echoing the password and refuses to create an account when any user already exists. Do not place the password in the command, runner logs, repository, or GitHub secrets unless a later deliberate automation design requires it.

## Secrets

Create `AUTH_SECRET` and `POSTGRES_PASSWORD` using a trusted password manager or local cryptographic generator. Place them directly in the NAS `.env` with owner-only permissions. Do not print, commit, upload, or copy them back to a development machine.

## SSH fallback

Direct SSH is a fallback only. Use a restricted non-root deployment account, key authentication, a verified host key, and deliberate LAN or VPN exposure. Never store the private key or production `.env` in this repository.

## Deployment status

The included workflow is a skeleton and has not run on a NAS. Its presence is not evidence of a successful deployment, backup, migration, or health check.
