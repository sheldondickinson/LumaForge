# ADR 0004: Build production images on the NAS runner initially

- Status: Accepted
- Date: 26/07/2026

## Context

The initial deployment targets one NAS and should not require a container registry. NAS capabilities remain unknown.

## Decision

The manually dispatched production workflow builds the image on the self-hosted NAS runner from the selected commit. Images receive repository, commit, version, and build-date labels. The deployment never relies solely on an unversioned `latest` tag.

## Consequences

The approach is private and simple but consumes NAS build resources. Reconsider GHCR when NAS architecture, memory, build performance, and rollback requirements are known.
