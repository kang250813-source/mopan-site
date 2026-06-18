"""FastAPI application for 魔盘 resource site."""

from __future__ import annotations

from urllib.parse import quote

from fastapi import FastAPI, Form, HTTPException, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.middleware.sessions import SessionMiddleware

from app import auth, database, jupan_bridge
from app.config import (
    ADMIN_PATH,
    BASE_PATH,
    CATEGORIES,
    CHANNELS,
    CLASSICS_GITHUB_USER,
    CONTACT_EMAIL,
    DB_PATH,
    DEFAULT_CHANNEL,
    JUPAN_COVERS_DIR,
    JUPAN_HOT_TAGS,
    JUPAN_HOT_TAGS_VISIBLE,
    JUPAN_PUBLIC_URL,
    QKDUANJU_PUBLIC_URL,
    PAGE_SIZE,
    PAN_LABEL,
    PUBLIC_SITE_URL,
    SECRET_KEY,
    SITE_SLOGAN,
    SITE_TITLE,
    SITE_VERSION,
    STATIC_DIR,
    STATIC_VERSION,
    TEMPLATES_DIR,
)
from app.admin_urls import admin_href, admin_root
from app.classics import library_label, library_subtitle
from app.highlight import highlight_pan_words
from app.i18n import (
    active_i18n,
    category_label,
    classic_library_label,
    classic_subtitle_label,
    drama_tag_label,
    get_i18n,
    set_active_i18n,
)
from app.pagination import build_page_url, clamp_page, page_window, total_pages as calc_total_pages
from app.qr_util import quark_qr_data_url
from app.game_picks import live_wheel_picks, wheel_picks_json
from app.urls import drama_share_url, resource_share_url

app = FastAPI(title=SITE_TITLE)
app.add_middleware(SessionMiddleware, secret_key=SECRET_KEY)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
if JUPAN_COVERS_DIR.is_dir():
    app.mount("/jupan-covers", StaticFiles(directory=JUPAN_COVERS_DIR), name="jupan-covers")
templates = Jinja2Templates(directory=TEMPLATES_DIR)

templates.env.globals.update(
    base_path=BASE_PATH,
    site_title=SITE_TITLE,
    site_slogan=SITE_SLOGAN,
    site_version=SITE_VERSION,
    static_version=STATIC_VERSION,
    categories=CATEGORIES,
    channels=CHANNELS,
    default_channel=DEFAULT_CHANNEL,
    contact_email=CONTACT_EMAIL,
    public_site_url=PUBLIC_SITE_URL,
    pan_label=PAN_LABEL,
    jupan_public_url=JUPAN_PUBLIC_URL,
    qkduanju_public_url=QKDUANJU_PUBLIC_URL,
    hot_tags=JUPAN_HOT_TAGS,
    hot_tags_visible=JUPAN_HOT_TAGS_VISIBLE,
    classics_github_user=CLASSICS_GITHUB_USER,
)
templates.env.filters["library_label"] = library_label
templates.env.filters["library_subtitle"] = library_subtitle
templates.env.filters["cat_label"] = category_label
templates.env.filters["lib_label"] = classic_library_label
templates.env.filters["lib_subtitle"] = classic_subtitle_label
templates.env.filters["drama_tag_label"] = drama_tag_label
templates.env.filters["qr_data_url"] = quark_qr_data_url
templates.env.filters["highlight_pan"] = highlight_pan_words
templates.env.filters["episode_count"] = jupan_bridge.episode_count
templates.env.filters["clean_title"] = jupan_bridge.clean_title
templates.env.filters["cover_src"] = jupan_bridge.cover_src
templates.env.globals["page_url"] = lambda page, q="", category="", channel="", tag="": build_page_url(
    BASE_PATH, page, q=q, category=category, channel=channel, tag=tag
)


def _strip_base(path: str) -> str:
    if BASE_PATH and path.startswith(BASE_PATH):
        return path[len(BASE_PATH) :] or "/"
    return path


def _with_base(path: str) -> str:
    if not BASE_PATH:
        return path
    return BASE_PATH + (path if path.startswith("/") else f"/{path}")


@app.middleware("http")
async def i18n_middleware(request: Request, call_next):
    inner = _strip_base(request.url.path)
    locale = "zh"

    if inner == "/en" or inner.startswith("/en/"):
        locale = "en"
        stripped = inner[3:] or "/"
        new_path = _with_base(stripped)
        request.scope["path"] = new_path
        request.scope["raw_path"] = new_path.encode("utf-8")

    lang = request.query_params.get("lang", "").strip().lower()
    if lang == "en":
        locale = "en"
    set_active_i18n(locale)
    return await call_next(request)


@app.on_event("startup")
def on_startup() -> None:
    database.init_db(DB_PATH)
    jupan_bridge.refresh_pan_cache()


def _locale_path(request: Request) -> str:
    path = _strip_base(request.url.path)
    if active_i18n().locale == "en" and not (path == "/en" or path.startswith("/en/")):
        path = "/en" + ("" if path == "/" else path)
    return path


def _i18n_bundle(request: Request, *, channel: str = "", tag: str = "") -> dict:
    i18n = active_i18n()
    path = _locale_path(request)
    base = BASE_PATH.rstrip("/")
    if i18n.locale == "en":
        base = f"{base}/en" if base else "/en"
    switch = i18n.locale_switch_href(path)
    if BASE_PATH and switch.startswith("/"):
        switch = f"{BASE_PATH.rstrip('/')}{switch}"
    return {
        "locale": i18n.locale,
        "html_lang": i18n.html_lang,
        "site_title": i18n.site_title,
        "site_slogan": i18n.site_slogan,
        "pan_label": i18n.pan_label,
        "channels": i18n.channels(),
        "asset_base": "",
        "base_path": base,
        "t": i18n.t,
        "js_messages": i18n.js_messages(),
        "locale_switch_href": switch,
        "hero_desc": i18n.hero(channel, tag=tag, github_user=CLASSICS_GITHUB_USER),
        "admin_base": admin_root(),
    }


def _ctx(request: Request, **extra):
    channel = str(extra.get("channel") or "")
    tag = str(extra.get("tag") or "")
    return {"request": request, "static_site": False, **_i18n_bundle(request, channel=channel, tag=tag), **extra}


def _request_base(request: Request) -> str:
    return str(request.base_url).rstrip("/")


def _channel_counts() -> dict[str, int]:
    counts = database.list_channel_counts()
    drama_total = jupan_bridge.count_dramas()
    if drama_total:
        counts["drama"] = drama_total
    return counts


@app.get("/", response_class=HTMLResponse)
def index(
    request: Request,
    q: str | None = None,
    category: str | None = None,
    channel: str | None = None,
    tag: str | None = None,
    page: int = 1,
):
    active_channel = (channel or DEFAULT_CHANNEL).strip()
    valid_ids = {c["id"] for c in CHANNELS}
    if active_channel not in valid_ids:
        active_channel = DEFAULT_CHANNEL
    channel_meta = next((c for c in CHANNELS if c["id"] == active_channel), CHANNELS[0])
    i18n = active_i18n()
    channel_meta = i18n.channel(active_channel)
    channel_counts = _channel_counts()

    if active_channel == "drama":
        active_tag = tag.strip() if tag else ""
        total = jupan_bridge.count_dramas(q=q, tag=active_tag or None)
        pages = calc_total_pages(total, PAGE_SIZE)
        current_page = clamp_page(page, pages)
        offset = (current_page - 1) * PAGE_SIZE
        dramas = jupan_bridge.list_dramas(
            q=q,
            tag=active_tag or None,
            limit=PAGE_SIZE,
            offset=offset,
        )
        return templates.TemplateResponse(
            "drama_channel.html",
            _ctx(
                request,
                dramas=dramas,
                q=q or "",
                tag=active_tag,
                channel=active_channel,
                channel_meta=channel_meta,
                channel_counts=channel_counts,
                total=total,
                total_all=channel_counts.get("drama", total),
                page=current_page,
                total_pages=pages,
                page_items=page_window(current_page, pages),
            ),
        )

    active_category = category.strip() if category else ""
    classics_prefix = active_channel == "classics" and bool(active_category)
    total = database.count_resources(
        q=q,
        category=active_category or None,
        channel=active_channel,
        category_prefix=classics_prefix,
    )
    pages = calc_total_pages(total, PAGE_SIZE)
    current_page = clamp_page(page, pages)
    offset = (current_page - 1) * PAGE_SIZE
    classics_shuffle = None
    if active_channel == "classics" and not (q or "").strip():
        from app.classics_shuffle import hourly_shuffle_seed

        classics_shuffle = hourly_shuffle_seed()
    resources = database.list_resources(
        q=q,
        category=active_category or None,
        channel=active_channel,
        category_prefix=classics_prefix,
        limit=PAGE_SIZE,
        offset=offset,
        shuffle_seed=classics_shuffle,
    )
    if active_channel == "classics":
        category_counts = database.list_classics_library_counts()
    else:
        category_counts = database.list_category_counts(channel=active_channel)
    total_all = channel_counts.get(active_channel, total)
    return templates.TemplateResponse(
        "index.html",
        _ctx(
            request,
            resources=resources,
            q=q or "",
            category=active_category,
            channel=active_channel,
            channel_meta=channel_meta,
            channel_counts=channel_counts,
            category_counts=category_counts,
            total=total,
            total_all=total_all,
            page=current_page,
            total_pages=pages,
            page_items=page_window(current_page, pages),
            classics_hourly_shuffle=classics_shuffle is not None,
        ),
    )


@app.get("/drama/{drama_id}", response_class=HTMLResponse)
def drama_detail(request: Request, drama_id: int):
    drama = jupan_bridge.get_drama(drama_id)
    if not drama:
        raise HTTPException(status_code=404, detail="短剧不存在")
    related = jupan_bridge.list_dramas(limit=6)
    related = [d for d in related if d.id != drama.id][:5]
    return templates.TemplateResponse(
        "drama_detail.html",
        _ctx(
            request,
            drama=drama,
            related=related,
            share_page_url=drama_share_url(drama_id, request_base=_request_base(request)),
        ),
    )


@app.get("/resource/{resource_id}", response_class=HTMLResponse)
def resource_detail(request: Request, resource_id: int):
    resource = database.get_resource(resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="资源不存在")
    if resource.channel == "classics":
        lib = library_label(resource.category)
        related = database.list_resources(
            category=lib or None,
            channel="classics",
            category_prefix=bool(lib),
            limit=6,
        )
    else:
        related = database.list_resources(
            category=resource.category, channel=resource.channel, limit=6
        )
    related = [r for r in related if r.id != resource.id][:5]
    return templates.TemplateResponse(
        "detail.html",
        _ctx(
            request,
            resource=resource,
            related=related,
            share_page_url=resource_share_url(resource_id, request_base=_request_base(request)),
        ),
    )


@app.get("/game", response_class=HTMLResponse)
@app.get("/game/", response_class=HTMLResponse)
def games_hub(request: Request):
    return templates.TemplateResponse("games_hub.html", _ctx(request))


@app.get("/game/stack", response_class=HTMLResponse)
@app.get("/game/stack/", response_class=HTMLResponse)
def game_stack(request: Request):
    return templates.TemplateResponse("game_stack.html", _ctx(request))


@app.get("/game/wheel", response_class=HTMLResponse)
@app.get("/game/wheel/", response_class=HTMLResponse)
def game_wheel(request: Request):
    bundle = _i18n_bundle(request)
    picks = live_wheel_picks(bundle["locale"], bundle["base_path"])
    return templates.TemplateResponse(
        "game_wheel.html",
        _ctx(request, wheel_picks_json=wheel_picks_json(picks)),
    )


@app.get("/game/match", response_class=HTMLResponse)
@app.get("/game/match/", response_class=HTMLResponse)
def game_match(request: Request):
    return templates.TemplateResponse("game_match.html", _ctx(request))


@app.get("/game/croc", response_class=HTMLResponse)
@app.get("/game/croc/", response_class=HTMLResponse)
def game_croc(request: Request):
    return templates.TemplateResponse("game_croc.html", _ctx(request))


@app.get("/game/bomb", response_class=HTMLResponse)
@app.get("/game/bomb/", response_class=HTMLResponse)
def game_bomb(request: Request):
    return templates.TemplateResponse("game_bomb.html", _ctx(request))


@app.get("/game/dice", response_class=HTMLResponse)
@app.get("/game/dice/", response_class=HTMLResponse)
def game_dice(request: Request):
    return templates.TemplateResponse("game_dice.html", _ctx(request))


@app.get("/game/finger", response_class=HTMLResponse)
@app.get("/game/finger/", response_class=HTMLResponse)
def game_finger(request: Request):
    return templates.TemplateResponse("game_finger.html", _ctx(request))


@app.get("/game/bobing", response_class=HTMLResponse)
@app.get("/game/bobing/", response_class=HTMLResponse)
def game_bobing(request: Request):
    return templates.TemplateResponse("game_bobing.html", _ctx(request))


@app.get("/game/chore", response_class=HTMLResponse)
@app.get("/game/chore/", response_class=HTMLResponse)
def game_chore(request: Request):
    return templates.TemplateResponse("game_chore.html", _ctx(request))


@app.get("/game/who", response_class=HTMLResponse)
@app.get("/game/who/", response_class=HTMLResponse)
def game_who(request: Request):
    return templates.TemplateResponse("game_who.html", _ctx(request))


@app.get("/game/topic", response_class=HTMLResponse)
@app.get("/game/topic/", response_class=HTMLResponse)
def game_topic(request: Request):
    return templates.TemplateResponse("game_topic.html", _ctx(request))


@app.api_route("/admin", methods=["GET", "POST", "HEAD"])
@app.api_route("/admin/{_path:path}", methods=["GET", "POST", "HEAD", "PUT", "DELETE"])
def admin_decoy(_path: str = ""):
    raise HTTPException(status_code=404, detail="Not Found")


@app.get(f"{ADMIN_PATH}/login", response_class=HTMLResponse)
@app.get(f"{ADMIN_PATH}/login/", response_class=HTMLResponse)
def admin_login_page(request: Request, error: str | None = None):
    auth.require_local_admin(request)
    if auth.is_admin(request):
        return RedirectResponse(admin_href(), status_code=303)
    return templates.TemplateResponse("admin/login.html", _ctx(request, error=error))


@app.post(f"{ADMIN_PATH}/login")
@app.post(f"{ADMIN_PATH}/login/")
def admin_login_submit(
    request: Request,
    username: str = Form(...),
    password: str = Form(...),
):
    auth.require_local_admin(request)
    if auth.login(request, username, password):
        return RedirectResponse(admin_href(), status_code=303)
    return templates.TemplateResponse(
        "admin/login.html",
        _ctx(request, error="用户名或密码错误"),
        status_code=401,
    )


@app.get(f"{ADMIN_PATH}/logout", response_class=HTMLResponse)
@app.get(f"{ADMIN_PATH}/logout/", response_class=HTMLResponse)
def admin_logout(request: Request):
    auth.require_local_admin(request)
    auth.logout(request)
    return RedirectResponse("/", status_code=303)


@app.get(ADMIN_PATH, response_class=HTMLResponse)
@app.get(f"{ADMIN_PATH}/", response_class=HTMLResponse)
def admin_dashboard(request: Request, q: str | None = None, msg: str | None = None):
    auth.require_local_admin(request)
    if not auth.is_admin(request):
        return RedirectResponse(admin_href("login"), status_code=303)
    resources = database.list_resources(q=q, limit=500)
    return templates.TemplateResponse(
        "admin/list.html",
        _ctx(request, resources=resources, q=q or "", msg=msg),
    )


@app.get(f"{ADMIN_PATH}/resource/new", response_class=HTMLResponse)
@app.get(f"{ADMIN_PATH}/resource/new/", response_class=HTMLResponse)
def admin_new_page(request: Request):
    auth.require_local_admin(request)
    if not auth.is_admin(request):
        return RedirectResponse(admin_href("login"), status_code=303)
    return templates.TemplateResponse(
        "admin/form.html",
        _ctx(request, resource=None, action="create"),
    )


@app.post(f"{ADMIN_PATH}/resource/new")
@app.post(f"{ADMIN_PATH}/resource/new/")
def admin_create(
    request: Request,
    title: str = Form(...),
    pan_url: str = Form(""),
    category: str = Form(""),
    excerpt: str = Form(""),
    content_html: str = Form(""),
    published_at: str = Form(""),
):
    auth.require_local_admin(request)
    if not auth.is_admin(request):
        return RedirectResponse(admin_href("login"), status_code=303)
    try:
        database.create_resource(
            title,
            pan_url,
            category or None,
            excerpt or None,
            content_html or None,
            published_at or None,
            link_status="own" if pan_url.strip() else "pending",
        )
    except Exception as exc:
        return templates.TemplateResponse(
            "admin/form.html",
            _ctx(
                request,
                resource={
                    "title": title,
                    "pan_url": pan_url,
                    "category": category,
                    "excerpt": excerpt,
                    "content_html": content_html,
                    "published_at": published_at,
                },
                action="create",
                error=str(exc),
            ),
            status_code=400,
        )
    return RedirectResponse(f"{admin_href()}?msg={quote('添加成功')}", status_code=303)


@app.get(f"{ADMIN_PATH}/resource/{{resource_id}}/edit", response_class=HTMLResponse)
def admin_edit_page(request: Request, resource_id: int):
    auth.require_local_admin(request)
    if not auth.is_admin(request):
        return RedirectResponse(admin_href("login"), status_code=303)
    resource = database.get_resource(resource_id)
    if not resource:
        raise HTTPException(status_code=404, detail="资源不存在")
    return templates.TemplateResponse(
        "admin/form.html",
        _ctx(request, resource=resource, action="edit"),
    )


@app.post(f"{ADMIN_PATH}/resource/{{resource_id}}/edit")
@app.post(f"{ADMIN_PATH}/resource/{{resource_id}}/edit/")
def admin_update(
    request: Request,
    resource_id: int,
    title: str = Form(...),
    pan_url: str = Form(""),
    category: str = Form(""),
    excerpt: str = Form(""),
    content_html: str = Form(""),
    published_at: str = Form(""),
    link_status: str = Form("pending"),
):
    auth.require_local_admin(request)
    if not auth.is_admin(request):
        return RedirectResponse(admin_href("login"), status_code=303)
    if pan_url.strip() and link_status == "pending":
        link_status = "own"
    database.update_resource(
        resource_id,
        title,
        pan_url,
        category or None,
        excerpt or None,
        content_html or None,
        published_at or None,
        link_status,
    )
    return RedirectResponse(f"{admin_href()}?msg={quote('已保存')}", status_code=303)


@app.post(f"{ADMIN_PATH}/resource/{{resource_id}}/delete")
@app.post(f"{ADMIN_PATH}/resource/{{resource_id}}/delete/")
def admin_delete(request: Request, resource_id: int):
    auth.require_local_admin(request)
    if not auth.is_admin(request):
        return RedirectResponse(admin_href("login"), status_code=303)
    database.delete_resource(resource_id)
    return RedirectResponse(f"{admin_href()}?msg={quote('已删除')}", status_code=303)
