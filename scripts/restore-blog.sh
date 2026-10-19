#!/usr/bin/env bash
set -euo pipefail

# Usage: restore-blog.sh <backup directory>
# Replaces the Ghost database and content volume with a backup made by backup-blog.sh.
backup_dir=${1:?Pass a backup directory such as /home/ubuntu/apps/portfolio-blog/backups/blog/20261019T000000Z}
[[ -f "$backup_dir/ghost.sql.gz" && -f "$backup_dir/content.tar.gz" ]] || {
  echo "$backup_dir must contain ghost.sql.gz and content.tar.gz" >&2
  exit 1
}
backup_dir=$(cd "$backup_dir" && pwd)
gzip -t "$backup_dir/ghost.sql.gz"
tar -tzf "$backup_dir/content.tar.gz" >/dev/null
image=$(docker inspect --format '{{.Config.Image}}' junha-blog-ghost-1)

docker stop junha-blog-ghost-1 >/dev/null
docker exec junha-blog-mysql-1 sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" exec mysql -uroot -e "DROP DATABASE IF EXISTS ghost"'
gzip -dc "$backup_dir/ghost.sql.gz" |
  docker exec -i junha-blog-mysql-1 sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" exec mysql -uroot'
docker run --rm --entrypoint sh -v junha-blog-content:/content -v "$backup_dir:/backup:ro" "$image" \
  -c 'find /content -mindepth 1 -maxdepth 1 -exec rm -rf {} + && tar -xzf /backup/content.tar.gz -C /content'
docker start junha-blog-ghost-1 >/dev/null
echo "Restored $backup_dir; run scripts/deploy-blog.sh to confirm the release is healthy"
