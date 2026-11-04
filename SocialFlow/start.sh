#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
docker compose up --build -d
printf '\nOpen http://localhost:3000 after services are healthy.\nLogin: admin@socialflow.local / SocialFlow123!\n'
