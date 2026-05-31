#!/bin/sh
set -e

./node_modules/.bin/prisma db push
exec node .next/standalone/server.js
