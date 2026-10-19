#!/usr/bin/env bash
set -euo pipefail

base_dir=${1:-/home/ubuntu/apps/portfolio-blog}
keep=${BLOG_BACKUP_KEEP:-10}
backup_root="$base_dir/backups/blog"
target="$backup_root/$(date -u +%Y%m%dT%H%M%SZ)"
image=$(docker inspect --format '{{.Config.Image}}' junha-blog-ghost-1)

umask 077
mkdir -p "$target"
docker exec junha-blog-mysql-1 sh -c \
  'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" exec mysqldump -uroot --single-transaction --routines --triggers --no-tablespaces --databases ghost' \
  | gzip > "$target/ghost.sql.gz"
docker run --rm --entrypoint tar -v junha-blog-content:/content:ro "$image" \
  -C /content --exclude=./logs -czf - . > "$target/content.tar.gz"
gzip -t "$target/ghost.sql.gz"
tar -tzf "$target/content.tar.gz" >/dev/null

find "$backup_root" -mindepth 1 -maxdepth 1 -type d | LC_ALL=C sort | head -n -"$keep" | xargs -r rm -rf
echo "Blog backup saved to $target"
