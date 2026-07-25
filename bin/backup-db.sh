#!/usr/bin/env bash
#
# Dump the Omnigate PostgreSQL database to a gzipped file and prune old copies.
# Intended to be run from cron on the deployment host. See docs/installation/VPS.md.
#
#   ./bin/backup-db.sh [backup_dir]
#
# Defaults to /opt/omnigate/backups. Retention is RETAIN_DAYS (default 14).

set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-/opt/omnigate}"
BACKUP_DIR="${1:-${BACKUP_DIR:-$PROJECT_DIR/backups}}"
RETAIN_DAYS="${RETAIN_DAYS:-14}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.prod.yml}"

cd "$PROJECT_DIR"
mkdir -p "$BACKUP_DIR"

target="$BACKUP_DIR/omnigate-$(date +%Y%m%d-%H%M%S).sql.gz"

# Without pipefail a failing pg_dump would still leave a valid-looking .gz,
# so the guard below plus `set -o pipefail` is what makes this trustworthy.
if ! docker compose -f "$COMPOSE_FILE" exec -T postgres \
	pg_dump -U omnigate --clean --if-exists omnigate | gzip > "$target"; then
	echo "backup failed, removing partial file: $target" >&2
	rm -f "$target"
	exit 1
fi

# A dump of a live Omnigate database is tens of KB at minimum; anything smaller
# means pg_dump wrote an error page or nothing at all.
size=$(stat -c%s "$target" 2>/dev/null || stat -f%z "$target")
if [ "$size" -lt 1024 ]; then
	echo "backup suspiciously small (${size} bytes), removing: $target" >&2
	rm -f "$target"
	exit 1
fi

find "$BACKUP_DIR" -name 'omnigate-*.sql.gz' -type f -mtime "+$RETAIN_DAYS" -delete

echo "$(date -Iseconds) ok $target ($((size / 1024)) KB)"
