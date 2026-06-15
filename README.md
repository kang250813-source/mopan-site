# 魔盘 · 本地资源站

独立项目，与剧盘无关。

## 启动

```bash
cd ~/mopan-site
chmod +x run.sh
./run.sh
```

| 页面 | 地址 |
|------|------|
| 前台 | http://localhost:8083 |
| 后台 | http://localhost:8083/admin/login |

默认账号：`admin` / `admin123`

## 从 mopan-sync 导入

```bash
cd ~/mopan-sync
./scripts/import_articles.sh    # 导入 ahhhhfs 文章到发现频道
./scripts/export_discover.sh      # 导出 data/discover.json（供 GitHub / 静态构建）
./scripts/import_catalog.sh     # 导入转存清单（源链接，标记待转存）
./scripts/publish_to_site.sh      # 转存完成后，创建自有分享并更新站点
```

## 每日同步 & GitHub Pages

```bash
# 手动跑一遍：抓取 → 导入 → 导出 → 构建 docs/ → 推送 GitHub
cd ~/mopan-sync
chmod +x scripts/daily_discover_sync.sh scripts/install_daily_cron.sh
./scripts/daily_discover_sync.sh

# 安装本地定时（每天 06:00）
./scripts/install_daily_cron.sh
```

线上预览（GitHub Pages）：https://kang250813-source.github.io/mopan-site/

GitHub Actions 也会每天自动同步（`.github/workflows/daily-discover-sync.yml`）。
