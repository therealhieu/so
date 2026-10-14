#!/bin/sh
# Runs the so binary from the platform package installed next to this one.
# A shell script so so replaces it (exec) instead of running as its child.
set -e

self=$0
while [ -L "$self" ]; do
  link=$(readlink "$self")
  case $link in
    /*) self=$link ;;
    *) self=$(dirname "$self")/$link ;;
  esac
done
pkg=$(cd "$(dirname "$self")/.." && pwd -P)

case "$(uname -s)-$(uname -m)" in
  Darwin-arm64) target=darwin-arm64 ;;
  Darwin-x86_64) target=darwin-x64 ;;
  Linux-x86_64) target=linux-x64 ;;
  Linux-aarch64 | Linux-arm64) target=linux-arm64 ;;
  *)
    echo "so: no build for $(uname -sm)" >&2
    exit 1
    ;;
esac

# Nested under this package, or a sibling (hoisted and isolated installs).
for bin in "$pkg/node_modules/@therealhieu/so-$target/bin/so" "$pkg/../so-$target/bin/so"; do
  if [ -x "$bin" ]; then exec "$bin" "$@"; fi
done
echo "so: @therealhieu/so-$target is not installed; reinstall @therealhieu/so with optional dependencies" >&2
exit 1
