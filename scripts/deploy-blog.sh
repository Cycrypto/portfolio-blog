#!/usr/bin/env bash
set -euo pipefail

base_dir=${1:-/home/ubuntu/apps/portfolio-blog}
release_dir=$(cd "$(dirname "$0")/.." && pwd)
env_file="$base_dir/.env.blog"
state_file="$base_dir/.blog-release"
compose_file="$release_dir/docker-compose.blog.yml"
[[ -f "$env_file" ]] || { echo "Configure $env_file first" >&2; exit 1; }

env_value() {
  local value
  value=$(sed -n "s/^$1=//p" "$env_file" | tail -n 1)
  value=${value%\"}
  value=${value#\"}
  value=${value%\'}
  value=${value#\'}
  printf '%s' "$value"
}
if [[ "$(env_value GHOST_STAFF_DEVICE_VERIFICATION)" != false && -z "$(env_value GHOST_SMTP_HOST)" ]]; then
  echo "Configure SMTP in $env_file or set GHOST_STAFF_DEVICE_VERIFICATION=false" >&2
  exit 1
fi

# The tag follows the theme and image recipe, so CV-only releases leave the blog running.
BLOG_VERSION=$(
  cd "$release_dir"
  {
    find ghost/Dockerfile ghost/docker-entrypoint.sh ghost/theme docker-compose.blog.yml -type f -print0 \
      | LC_ALL=C sort -z | xargs -0 sha256sum
    printf 'ghost-image=%s\n' "$(env_value GHOST_IMAGE)"
  } | sha256sum | cut -c1-16
)
export BLOG_VERSION
image="junha-blog-ghost:$BLOG_VERSION"
port=$(env_value BLOG_PORT)
port=${port:-13001}
compose=(docker compose --env-file "$env_file" -f "$compose_file")
"${compose[@]}" config --quiet

if ! docker image inspect "$image" >/dev/null 2>&1; then
  "${compose[@]}" build --pull ghost
fi

previous_version=""
previous_compose=""
if [[ -f "$state_file" ]]; then
  read -r previous_version previous_compose < "$state_file" || true
fi

running_image=$(docker inspect --format '{{.Config.Image}}' junha-blog-ghost-1 2>/dev/null || true)
if [[ -n "$running_image" && "$running_image" != "$image" ]]; then
  # Ghost upgrades can migrate the database, so keep a restorable copy first.
  bash "$release_dir/scripts/backup-blog.sh" "$base_dir"
fi

verify() {
  curl --fail --silent --show-error -o /dev/null -H 'X-Forwarded-Proto: https' \
    "http://127.0.0.1:$port/ghost/api/admin/site/" &&
    curl --fail --silent --show-error -o /dev/null -H 'X-Forwarded-Proto: https' "http://127.0.0.1:$port/"
}
rollback() {
  if [[ -n "$previous_version" && "$previous_version" != "$BLOG_VERSION" && -f "$previous_compose" ]]; then
    echo "Restoring blog image $previous_version" >&2
    BLOG_VERSION="$previous_version" docker compose --env-file "$env_file" -f "$previous_compose" \
      up -d --wait --wait-timeout 240 ghost || true
    echo "If Ghost migrated the database, restore the newest backup in $base_dir/backups/blog" >&2
  fi
}

if ! "${compose[@]}" up -d --wait --wait-timeout 240 || ! verify; then
  "${compose[@]}" logs --tail 80 ghost >&2 || true
  rollback
  exit 1
fi

printf '%s %s\n' "$BLOG_VERSION" "$compose_file" > "$state_file"
echo "Blog release $BLOG_VERSION is healthy"
"${compose[@]}" ps
