#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

if [[ ! -d .venv ]]; then
  python3 -m venv .venv
  .venv/bin/pip install -r requirements.txt
fi

export SITE_TITLE="${SITE_TITLE:-魔盘}"
export SITE_SLOGAN="${SITE_SLOGAN:-夸克网盘 · 自用资源索引 · 本地整理}"
export PAN_TYPE="${PAN_TYPE:-quark}"
export PAN_ACCOUNT="${PAN_ACCOUNT:-main}"
export ADMIN_USER="${ADMIN_USER:-admin}"
export ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin123}"
export SECRET_KEY="${SECRET_KEY:-mopan-site-dev-secret}"
export DB_PATH="${DB_PATH:-$(pwd)/data/site.db}"

mkdir -p data
exec .venv/bin/uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8083}" --reload
