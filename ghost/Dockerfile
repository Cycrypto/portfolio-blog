# syntax=docker/dockerfile:1
ARG GHOST_IMAGE=ghost:6.71.0-alpine
FROM ${GHOST_IMAGE}

# The official entrypoint copies content.orig/themes/* into the content volume when missing.
COPY --chown=node:node theme /var/lib/ghost/content.orig/themes/junha
COPY --chmod=0755 docker-entrypoint.sh /usr/local/bin/junha-entrypoint.sh

ENTRYPOINT ["junha-entrypoint.sh"]
CMD ["node", "current/index.js"]

HEALTHCHECK --interval=15s --timeout=5s --start-period=90s --retries=8 \
  CMD node -e "fetch('http://127.0.0.1:2368/ghost/api/admin/site/', { headers: { 'x-forwarded-proto': 'https' }, redirect: 'manual' }).then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
