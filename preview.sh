#!/usr/bin/env bash
# 本地预览静态站（与 GitHub Pages 一致）
set -euo pipefail
cd "$(dirname "$0")"

PORT="${PORT:-8083}"
DOCS="$(pwd)/docs"

if [[ ! -f "$DOCS/index.html" ]]; then
  echo "docs/ 不存在，先构建..."
  BASE_PATH=/ CUSTOM_DOMAIN=www.mopan.lol .venv/bin/python scripts/build_static.py
fi

port_listening() {
  ss -tln 2>/dev/null | grep -q ":${PORT} " && return 0
  curl -sf "http://127.0.0.1:${PORT}/" >/dev/null 2>&1
}

if port_listening; then
  LAN=$(hostname -I 2>/dev/null | awk '{print $1}')
  echo "已在运行: http://127.0.0.1:${PORT}/"
  echo "       英文: http://127.0.0.1:${PORT}/en/"
  [[ -n "$LAN" ]] && echo "   局域网: http://${LAN}:${PORT}/"
  echo "停止: pkill -f 'python3 -m http.server ${PORT}'"
  exit 0
fi

echo "启动本地预览..."
cd "$DOCS"
nohup python3 -m http.server "$PORT" --bind 0.0.0.0 >> /tmp/mopan-preview.log 2>&1 &
sleep 1

if curl -sf "http://127.0.0.1:${PORT}/" >/dev/null; then
  LAN=$(hostname -I 2>/dev/null | awk '{print $1}')
  echo ""
  echo "✅ 魔盘本地预览已启动"
  echo "   中文: http://127.0.0.1:${PORT}/"
  echo "   英文: http://127.0.0.1:${PORT}/en/"
  echo "   本机: http://localhost:${PORT}/"
  [[ -n "$LAN" ]] && echo "   局域网: http://${LAN}:${PORT}/"
  echo ""
  echo "日志: /tmp/mopan-preview.log"
else
  echo "❌ 启动失败，查看 /tmp/mopan-preview.log"
  tail -10 /tmp/mopan-preview.log 2>/dev/null || true
  exit 1
fi
