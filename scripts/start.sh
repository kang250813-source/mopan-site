#!/usr/bin/env bash
# 后台启动魔盘（不占用当前终端）
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ ! -d .venv ]]; then
  python3 -m venv .venv
  .venv/bin/pip install -q -r requirements.txt
fi

export SITE_TITLE="${SITE_TITLE:-魔盘}"
export PAN_TYPE="${PAN_TYPE:-quark}"
export PAN_ACCOUNT="${PAN_ACCOUNT:-main}"
export DB_PATH="${DB_PATH:-$(pwd)/data/site.db}"

PORT="${PORT:-8083}"
PIDFILE="/tmp/mopan-site-${PORT}.pid"
LOG="/tmp/mopan-site.log"

if [[ -f "$PIDFILE" ]]; then
  old=$(cat "$PIDFILE")
  if kill -0 "$old" 2>/dev/null; then
    echo "已在运行 (pid $old) → http://localhost:${PORT}"
    exit 0
  fi
fi

nohup .venv/bin/uvicorn app.main:app --host 0.0.0.0 --port "$PORT" >>"$LOG" 2>&1 &
echo $! >"$PIDFILE"
sleep 1

if curl -sf -o /dev/null --connect-timeout 3 "http://127.0.0.1:${PORT}/"; then
  echo "魔盘已启动 → http://localhost:${PORT}"
  echo "短剧频道 → http://localhost:${PORT}/?channel=drama"
  echo "日志: $LOG"
  echo "停止: ./scripts/stop.sh"
else
  echo "启动可能失败，查看日志: tail -f $LOG"
  exit 1
fi
