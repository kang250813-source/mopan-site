#!/usr/bin/env bash
# 本机后台改完后：导出数据，便于 git push 更新线上站
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

echo "==> 导出 data/export ..."
.venv/bin/python scripts/export_data.py

echo ""
echo "完成。接下来可提交并推送："
echo "  git add data/export data/discover.json data/sync_meta.json"
echo "  git commit -m 'chore: export site data'"
echo "  git push origin main"
echo ""
echo "GitHub Actions 会自动 build 并部署到 www.mopan.lol"
