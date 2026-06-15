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
./scripts/import_catalog.sh    # 导入转存清单（源链接，标记待转存）
./scripts/publish_to_site.sh   # 转存完成后，创建自有分享并更新站点
```
