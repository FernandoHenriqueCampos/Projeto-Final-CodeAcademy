#!/usr/bin/env bash
set -euo pipefail

cd /app

if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
    else
        touch .env
    fi
fi

if [ -z "${APP_KEY:-}" ] && ! grep -q '^APP_KEY=.\+' .env; then
    php artisan key:generate --force
fi

if [ "${DB_CONNECTION:-}" = "mysql" ] && [ -n "${DB_HOST:-}" ]; then
    echo "Waiting for MySQL at ${DB_HOST}:${DB_PORT:-3306}..."
    for i in $(seq 1 "${DB_WAIT_TIMEOUT:-20}"); do
        if timeout 1 bash -c "cat < /dev/null > /dev/tcp/${DB_HOST}/${DB_PORT:-3306}" >/dev/null 2>&1; then
            echo "MySQL is reachable."
            break
        fi
        sleep 1
    done
fi

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
    php artisan migrate --force --no-interaction || true
fi

if [ "${RUN_SEEDERS:-true}" = "true" ]; then
    php artisan db:seed --force --no-interaction || true
fi

if [ "${APP_ENV:-production}" = "production" ]; then
    php artisan config:cache
    php artisan route:cache
    php artisan event:cache
else
    php artisan config:clear
    php artisan route:clear
fi

php artisan storage:link --force 2>/dev/null || true

exec "$@"
