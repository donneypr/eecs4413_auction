#!/usr/bin/env bash
set -e
echo "Waiting for db at $MYSQL_HOST:$MYSQL_PORT..."
until nc -z "$MYSQL_HOST" "$MYSQL_PORT"; do sleep 1; done
python manage.py migrate --noinput
python manage.py runserver 0.0.0.0:8000