ARG PHP_VERSION=8.4
ARG COMPOSER_VERSION=2
ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-alpine AS frontend-build

WORKDIR /frontend

COPY Frontend/package*.json ./
RUN npm ci

COPY Frontend/. ./
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

FROM composer:${COMPOSER_VERSION} AS vendor

WORKDIR /app

COPY Backend/composer.json Backend/composer.lock ./
RUN --mount=type=cache,target=/tmp/composer-cache \
    COMPOSER_CACHE_DIR=/tmp/composer-cache \
    composer install \
        --no-dev \
        --no-interaction \
        --no-scripts \
        --prefer-dist \
        --no-progress

COPY Backend/. ./
RUN composer dump-autoload --classmap-authoritative --no-dev

FROM dunglas/frankenphp:1-php${PHP_VERSION}-alpine AS runtime

ENV APP_ENV=production \
    APP_DEBUG=false \
    SERVER_NAME=":8000" \
    PHP_INI_MEMORY_LIMIT=256M \
    COMPOSER_ALLOW_SUPERUSER=1

RUN apk add --no-cache \
        bash \
        mysql-client \
        tini \
    && install-php-extensions \
        pdo_mysql \
        intl \
        zip \
        bcmath \
        opcache \
        pcntl \
        gd \
        redis

WORKDIR /app

COPY --from=vendor /app /app
COPY --from=frontend-build /frontend/dist/index.html /app/public/spa/index.html
COPY --from=frontend-build /frontend/dist/assets /app/public/assets
COPY --from=frontend-build /frontend/dist/code-solid-full.svg /app/public/code-solid-full.svg

COPY Backend/docker/entrypoint.sh /usr/local/bin/entrypoint
COPY Backend/docker/php.ini /usr/local/etc/php/conf.d/zz-app.ini

RUN chmod +x /usr/local/bin/entrypoint \
    && mkdir -p storage/framework/{cache,sessions,testing,views} storage/logs bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R ug+rwX storage bootstrap/cache

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD wget -qO- http://127.0.0.1:8000/up >/dev/null 2>&1 || exit 1

ENTRYPOINT ["/sbin/tini", "--", "/usr/local/bin/entrypoint"]
CMD ["frankenphp", "run", "--config", "/etc/caddy/Caddyfile"]
