#!/bin/sh
set -e

# Bind-mounted data dirs often come in owned by root (or a different uid) on
# the host, which blocks the nextjs user from writing the sqlite file. Fix
# ownership here (as root) before dropping to the unprivileged user.
chown -R nextjs:nodejs /app/data

exec su-exec nextjs "$@"
