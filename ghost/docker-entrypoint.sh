#!/bin/sh
set -eu

# Remove the copy left in the content volume so this image's theme is installed on every start.
rm -rf "${GHOST_CONTENT:?}/themes/junha"
exec docker-entrypoint.sh "$@"
