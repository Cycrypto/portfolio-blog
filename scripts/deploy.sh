#!/usr/bin/env bash
set -euo pipefail

base_dir=${1:-/home/ubuntu/apps/portfolio-blog}
release_dir=$(cd "$(dirname "$0")/.." && pwd)
env_file="$base_dir/.env.portfolio"
: "${DEPLOYMENT_VERSION:?Set DEPLOYMENT_VERSION to the release commit SHA}"
[[ "$DEPLOYMENT_VERSION" =~ ^[a-f0-9]{40}$ ]] || { echo "Expected a full commit SHA" >&2; exit 1; }
[[ -f "$env_file" ]] || { echo "Configure $env_file first" >&2; exit 1; }

compose=(docker compose --env-file "$env_file" -f "$release_dir/docker-compose.prod.yml")
"${compose[@]}" config --quiet
if [[ "${DEPLOY_PREBUILT:-0}" == 1 ]]; then
  docker image inspect "portfolio-blog:$DEPLOYMENT_VERSION" >/dev/null
else
  "${compose[@]}" build portfolio
fi

# Verify the new image before attaching its production routing labels.
check_name="portfolio-check-${DEPLOYMENT_VERSION:0:12}"
cleanup() { docker rm -f "$check_name" >/dev/null 2>&1 || true; }
trap cleanup EXIT
docker run -d --name "$check_name" --env-file "$env_file" \
  --tmpfs /app/data:uid=1000,gid=1000,mode=0700 \
  --publish 127.0.0.1::3000 "portfolio-blog:$DEPLOYMENT_VERSION" >/dev/null
healthy=false
for ((attempt=0; attempt<60; attempt++)); do
  if [[ $(docker inspect --format '{{.State.Health.Status}}' "$check_name") == healthy ]]; then
    healthy=true
    break
  fi
  sleep 2
done
if [[ "$healthy" != true ]]; then
  docker logs --tail 80 "$check_name"
  echo "New image did not become healthy; production was not changed" >&2
  exit 1
fi
check_port=$(docker port "$check_name" 3000/tcp | awk -F: '{print $NF}')
curl --fail --silent --show-error "http://127.0.0.1:$check_port/" -o /dev/null
curl --fail --silent --show-error "http://127.0.0.1:$check_port/blog" -o /dev/null
cleanup
trap - EXIT

previous_release=$(readlink -f "$base_dir/current" 2>/dev/null || true)
previous_version=""
if [[ -n "$previous_release" && -f "$previous_release/.deployment-version" ]]; then
  previous_version=$(cat "$previous_release/.deployment-version")
fi
rollback() {
  if [[ -n "$previous_version" && -f "$previous_release/docker-compose.prod.yml" ]]; then
    echo "Restoring previous portfolio release"
    DEPLOYMENT_VERSION="$previous_version" docker compose --env-file "$env_file" \
      -f "$previous_release/docker-compose.prod.yml" up -d --wait --wait-timeout 120 portfolio
  else
    # The first replacement leaves the old application's containers available.
    "${compose[@]}" stop portfolio
  fi
}
if ! "${compose[@]}" up -d --wait --wait-timeout 120 portfolio; then
  rollback
  exit 1
fi
if ! curl --fail --silent --show-error http://127.0.0.1:13000/api/health; then
  rollback
  exit 1
fi
printf '%s\n' "$DEPLOYMENT_VERSION" > "$release_dir/.deployment-version"
ln -sfn "$release_dir" "$base_dir/current"
echo "Portfolio release $DEPLOYMENT_VERSION is healthy"
"${compose[@]}" ps
