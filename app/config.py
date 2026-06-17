"""Application settings."""

from __future__ import annotations

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
TEMPLATES_DIR = BASE_DIR / "app" / "templates"
STATIC_DIR = BASE_DIR / "static"

SITE_TITLE = os.getenv("SITE_TITLE", "魔盘")
SITE_SLOGAN = os.getenv("SITE_SLOGAN", "AI 工具 · 学习资源 · 短剧索引")
BASE_PATH = os.getenv("BASE_PATH", "").rstrip("/")

PAN_TYPE = os.getenv("PAN_TYPE", "quark")
PAN_ACCOUNT = os.getenv("PAN_ACCOUNT", "main")
PAN_LABELS = {
    "baidu": "百度网盘",
    "quark": "夸克网盘",
    "aliyun": "阿里云盘",
    "123pan": "123云盘",
}
PAN_LABEL = PAN_LABELS.get(PAN_TYPE, "网盘")

CHANNELS = [
    {"id": "discover", "label": "发现", "hint": "AI 工具 · 效率软件"},
    {"id": "drama", "label": "短剧", "hint": "热门短剧 · 夸克直达"},
    {"id": "media", "label": "影视音乐", "hint": "电影动漫 · 音乐有声"},
    {"id": "other", "label": "其它", "hint": "网盘杂项 · 社区收录"},
    {"id": "k12", "label": "K12", "hint": "学前至高中 · 学生教育"},
    {"id": "ai_video", "label": "AI 学习", "hint": "AI 视频教程"},
    {"id": "classics", "label": "古典藏书", "hint": "经史子集 · 摘录预览"},
]

DEFAULT_CHANNEL = "discover"

CATEGORIES = [
    c.strip()
    for c in os.getenv(
        "CATEGORIES",
        "AI 工具,在线工具,软件应用,开发者项目,教程指南,Windows 软件,macOS 软件,其他",
    ).split(",")
    if c.strip()
]

ADMIN_USER = os.getenv("ADMIN_USER", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")
SECRET_KEY = os.getenv("SECRET_KEY", "mopan-site-dev-secret-change-me")
DB_PATH = Path(os.getenv("DB_PATH", str(DATA_DIR / "site.db")))
PAGE_SIZE = max(12, int(os.getenv("PAGE_SIZE", "24")))

# 剧盘（短剧频道数据源 · 网盘1 main）
JUPAN_SITE_ROOT = Path(os.getenv("JUPAN_SITE_ROOT", str(Path.home() / "duanjuku-site"))).expanduser()
JUPAN_SITE_DB = Path(os.getenv("JUPAN_SITE_DB", str(JUPAN_SITE_ROOT / "data" / "site.db"))).expanduser()
JUPAN_SYNC_DB = Path(os.getenv("JUPAN_SYNC_DB", str(Path.home() / "duanjuku-sync" / "data" / "dramas.db"))).expanduser()
JUPAN_MAIN_SHARE_CACHE = Path(
    os.getenv("JUPAN_MAIN_SHARE_CACHE", str(Path.home() / "duanjuku-sync" / "data" / "my_share_links.json"))
).expanduser()
JUPAN_PUBLIC_URL = os.getenv("JUPAN_PUBLIC_URL", "https://www.jupan.lol").rstrip("/")
QKDUANJU_PUBLIC_URL = os.getenv("QKDUANJU_PUBLIC_URL", "https://qkduanju.com").rstrip("/")
CLASSICS_GITHUB_USER = os.getenv("CLASSICS_GITHUB_USER", "kang250813-source")
JUPAN_HOT_TAGS_VISIBLE = max(8, int(os.getenv("JUPAN_HOT_TAGS_VISIBLE", "12")))
JUPAN_HOT_TAGS = [
    t.strip()
    for t in os.getenv(
        "JUPAN_HOT_TAGS",
        "国外短剧,娇妻,阿姨,夫人,女友,老婆,前妻,千金,公主,宠妻,女王,女神,甜妻,都市,穿越,隐龙,绝世,战神,归来,至尊,神医,总裁,首富,亿万,少爷,王爷,大佬,神豪,天尊,狂少,老公,逆袭,保安,赘婿,离婚,闪婚,爱恨,老师,前夫,龙帅,萌宝,婿,丐,虐,傻,龙,总,婚,兵,医",
    ).split(",")
    if t.strip()
]
JUPAN_COVERS_DIR = JUPAN_SITE_ROOT / "static" / "covers"
PUBLIC_SITE_URL = os.getenv("PUBLIC_SITE_URL", "https://www.mopan.lol").rstrip("/")
CONTACT_EMAIL = os.getenv("CONTACT_EMAIL", "").strip()

SITE_VERSION = "0.2.0"


def static_version() -> str:
    css = STATIC_DIR / "mopan.css"
    try:
        return str(int(css.stat().st_mtime))
    except OSError:
        return "1"


def jupan_cover_version() -> str:
    for covers_dir in (BASE_DIR / "docs" / "jupan-covers", DATA_DIR / "jupan-covers"):
        if not covers_dir.is_dir():
            continue
        try:
            mtimes = [p.stat().st_mtime for p in covers_dir.glob("*.webp")]
            if mtimes:
                return str(int(max(mtimes)))
        except OSError:
            continue
    return "1"


STATIC_VERSION = static_version()
JUPAN_COVER_VERSION = jupan_cover_version()
