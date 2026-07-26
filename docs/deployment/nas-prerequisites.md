# NAS information required before deployment

Repository bootstrap is not blocked by missing NAS information. A real deployment requires confirmation of:

- manufacturer, model, and operating system
- CPU architecture (`linux/amd64` or `linux/arm64`)
- Docker and Docker Compose versions
- SSH availability and self-hosted GitHub Actions runner support
- Portainer availability
- reverse proxy, local DNS hostname, and TLS requirements
- deployment, persistent data, and backup directories
- available memory and storage
- database backup destination
- desired application port
- LAN-only or remote-access requirements

Before changing anything, run non-destructive checks on the NAS:

```bash
uname -a
uname -m
docker version
docker compose version
df -h
free -h
id
pwd
```

Do not alter the NAS firewall, storage pools, users, reverse proxy, or Docker daemon without explicit approval.
