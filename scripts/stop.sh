#!/usr/bin/env bash
set -euo pipefail
PORT="${PORT:-8083}"
PIDFILE="/tmp/mopan-site-${PORT}.pid"
if [[ -f "$PIDFILE" ]]; then
  pid=$(cat "$PIDFILE")
  kill "$pid" 2>/dev/null && echo "已停止魔盘 (pid $pid)" || echo "进程不存在"
  rm -f "$PIDFILE"
else
  pkill -f "mopan-site/.venv/bin/.*uvicorn app.main:app.*--port ${PORT}" 2>/dev/null \
    || pkill -f "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}" 2>/dev/null \
    && echo "已停止" || echo "未找到运行中的魔盘"
fi
