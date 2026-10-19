#!/usr/bin/env bash
set -euo pipefail

base_dir=${1:-/home/ubuntu/apps/portfolio-blog}
keep=${BLOG_BACKUP_KEEP:-10}
backup_root="$base_dir/backups/blog"
target="$backup_root/$(date -u +%Y%m%dT%H%M%SZ)"
partial="$target.partial"
image=$(docker inspect --format '{{.Config.Image}}' junha-blog-ghost-1)

umask 077
mkdir -p "$partial"
trap 'rm -rf "$partial"' EXIT
docker exec junha-blog-mysql-1 sh -c \
  'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" exec mysqldump -uroot --single-transaction --routines --triggers --no-tablespaces --databases ghost' \
  | gzip > "$partial/ghost.sql.gz"
docker run --rm --entrypoint tar -v junha-blog-content:/content:ro "$image" \
  -C /content --exclude=./logs -czf - . > "$partial/content.tar.gz"
gzip -t "$partial/ghost.sql.gz"
tar -tzf "$partial/content.tar.gz" >/dev/null
mv "$partial" "$target"
trap - EXIT

find "$backup_root" -mindepth 1 -maxdepth 1 -type d ! -name '*.partial' | LC_ALL=C sort -r | tail -n +"$((keep + 1))" |
  while IFS= read -r old_backup; do rm -rf "$old_backup"; done
echo "Blog backup saved to $target"
