/*!
 * WukongI18n — 全站统一国际化框架
 * 所有游戏项目共用。请勿在各游戏内重复实现语言系统。
 *
 * 用法（任意子目录的游戏页面）：
 *   <script src="<相对路径>/assets/i18n/i18n.js"></script>
 *   <script>
 *     WukongI18n.init({
 *       locales: ['zh-CN','en-US'],     // 该页面需要加载的语言（可选，默认全部）
 *       packs: ['common','civ'],        // 需要的命名空间文件（见 locales/<lang>/<pack>.json）
 *       mount: '#lang-switch'            // 语言切换器挂载点（可选）
 *     }).then(function(){ render(); });
 *
 *   t('common.start_game')              // => "开始游戏" / "Start Game"
 *   t('life.stat.money', {n: 5})        // 带插值
 *   WukongI18n.applyDOM()               // 翻译所有 [data-i18n] 元素
 *   WukongI18n.onChange(function(){ ... })  // 语言切换回调
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'wukong-locale';

  // 受支持的语言（含预留）
  var SUPPORTED = [
    { code: 'zh-CN', flag: '🇨🇳', name: '中文',     native: '简体中文' },
    { code: 'en-US', flag: '🇺🇸', name: 'English',  native: 'English' },
    { code: 'vi-VN', flag: '🇻🇳', name: 'Tiếng Việt', native: 'Tiếng Việt', reserved: true },
    { code: 'ja-JP', flag: '🇯🇵', name: '日本語',   native: '日本語', reserved: true },
    { code: 'ko-KR', flag: '🇰🇷', name: '한국어',   native: '한국어', reserved: true }
  ];

  var FALLBACK = 'en-US';        // 找不到键时的回退语言
  var DEFAULT  = 'zh-CN';        // 默认语言

  // 自动探测本脚本所在目录，得到 i18n 根路径（兼容任意子目录）
  function detectBase() {
    var s = document.currentScript;
    if (!s) {
      var all = document.getElementsByTagName('script');
      for (var i = all.length - 1; i >= 0; i--) {
        if (/i18n\.js(\?|$)/.test(all[i].src)) { s = all[i]; break; }
      }
    }
    if (s && s.src) return s.src.replace(/\/i18n\.js(\?.*)?$/, '/');
    return 'assets/i18n/';
  }
  var BASE = detectBase();

  var state = {
    locale: DEFAULT,
    loaded: {},          // locale -> merged dict
    listeners: [],
    ready: false,
    config: { packs: ['common'], locales: null, mount: null }
  };

  /* ---------- locale detection ---------- */
  function detectInitial() {
    var saved = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) {}
    if (saved && isSupported(saved)) return saved;
    // 浏览器语言匹配
    var navs = (navigator.languages || [navigator.language || '']).map(String);
    for (var i = 0; i < navs.length; i++) {
      var n = navs[i].toLowerCase();
      if (n.indexOf('zh') === 0) return 'zh-CN';
      if (n.indexOf('en') === 0) return 'en-US';
      if (n.indexOf('vi') === 0) return 'vi-VN';
      if (n.indexOf('ja') === 0) return 'ja-JP';
      if (n.indexOf('ko') === 0) return 'ko-KR';
    }
    return DEFAULT;
  }
  function isSupported(code) {
    for (var i = 0; i < SUPPORTED.length; i++) if (SUPPORTED[i].code === code) return true;
    return false;
  }

  /* ---------- deep merge for namespaced packs ---------- */
  function deepMerge(target, src) {
    for (var k in src) {
      if (src.hasOwnProperty(k)) {
        if (src[k] && typeof src[k] === 'object' && !Array.isArray(src[k]) &&
            target[k] && typeof target[k] === 'object') {
          deepMerge(target[k], src[k]);
        } else {
          target[k] = src[k];
        }
      }
    }
    return target;
  }

  /* ---------- load a locale's packs ---------- */
  function loadLocale(locale, packs) {
    state.loaded[locale] = state.loaded[locale] || {};
    var jobs = packs.map(function (pack) {
      var url = BASE + 'locales/' + locale + '/' + pack + '.json';
      return fetch(url, { cache: 'no-cache' })
        .then(function (r) { return r.ok ? r.json() : {}; })
        .then(function (json) { deepMerge(state.loaded[locale], json); })
        .catch(function () { /* missing pack tolerated */ });
    });
    return Promise.all(jobs);
  }

  /* ---------- key lookup (dot path) ---------- */
  function has(obj, k) { return Object.prototype.hasOwnProperty.call(obj, k); }
  function lookup(dict, key) {
    if (!dict) return undefined;
    if (has(dict, key)) return dict[key];              // flat key support (own keys only)
    var parts = key.split('.'), cur = dict;
    for (var i = 0; i < parts.length; i++) {
      if (cur && typeof cur === 'object' && has(cur, parts[i])) cur = cur[parts[i]];
      else return undefined;
    }
    return cur;
  }

  function interpolate(str, vars) {
    if (!vars) return str;
    return str.replace(/\{(\w+)\}/g, function (m, k) {
      return vars[k] !== undefined ? vars[k] : m;
    });
  }

  /* ---------- public t() ---------- */
  function t(key, vars) {
    var v = lookup(state.loaded[state.locale], key);
    if (v === undefined) v = lookup(state.loaded[FALLBACK], key);
    if (v === undefined) v = lookup(state.loaded[DEFAULT], key);
    if (v === undefined) return key;                   // 兜底返回键名，便于发现缺漏
    return typeof v === 'string' ? interpolate(v, vars) : v;
  }

  /* ---------- DOM auto-binding ---------- */
  function applyDOM(root) {
    root = root || document;
    // textContent
    var nodes = root.querySelectorAll('[data-i18n]');
    Array.prototype.forEach.call(nodes, function (el) {
      var key = el.getAttribute('data-i18n');
      var vars = parseVars(el.getAttribute('data-i18n-vars'));
      el.textContent = t(key, vars);
    });
    // innerHTML（信任的内置文案，可含 <br> 等）
    var htmlNodes = root.querySelectorAll('[data-i18n-html]');
    Array.prototype.forEach.call(htmlNodes, function (el) {
      el.innerHTML = t(el.getAttribute('data-i18n-html'), parseVars(el.getAttribute('data-i18n-vars')));
    });
    // 属性：data-i18n-attr="placeholder:key;title:key2"
    var attrNodes = root.querySelectorAll('[data-i18n-attr]');
    Array.prototype.forEach.call(attrNodes, function (el) {
      el.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
        var seg = pair.split(':');
        if (seg.length === 2) el.setAttribute(seg[0].trim(), t(seg[1].trim()));
      });
    });
    // 文档标题
    var titleEl = root.querySelector ? root.querySelector('[data-i18n-title]') : null;
    if (titleEl) document.title = t(titleEl.getAttribute('data-i18n-title'));
  }
  function parseVars(s) {
    if (!s) return null;
    try { return JSON.parse(s); } catch (e) { return null; }
  }

  /* ---------- locale switching ---------- */
  function setLocale(locale) {
    if (!isSupported(locale) || locale === state.locale && state.ready) {
      if (locale === state.locale) return Promise.resolve();
    }
    var needLoad = !state.loaded[locale] || Object.keys(state.loaded[locale]).length === 0;
    var p = needLoad ? loadLocale(locale, state.config.packs) : Promise.resolve();
    return p.then(function () {
      state.locale = locale;
      try { localStorage.setItem(STORAGE_KEY, locale); } catch (e) {}
      document.documentElement.setAttribute('lang', locale);
      applyDOM();
      renderSwitcher();
      state.listeners.forEach(function (cb) { try { cb(locale); } catch (e) {} });
    });
  }

  function onChange(cb) { if (typeof cb === 'function') state.listeners.push(cb); }

  /* ---------- language switcher UI ---------- */
  function renderSwitcher() {
    var mount = state.config.mount
      ? (typeof state.config.mount === 'string' ? document.querySelector(state.config.mount) : state.config.mount)
      : document.getElementById('wk-lang-switch');
    if (!mount) return;
    mount.innerHTML = '';
    mount.className = (mount.className || '') + (mount.className.indexOf('wk-lang') < 0 ? ' wk-lang' : '');
    SUPPORTED.forEach(function (L) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'wk-lang-btn' + (L.code === state.locale ? ' on' : '') + (L.reserved ? ' reserved' : '');
      b.title = L.native + (L.reserved ? ' (即将支持)' : '');
      b.innerHTML = '<span class="wk-flag">' + L.flag + '</span><span class="wk-name">' + L.name + '</span>';
      b.onclick = function () { setLocale(L.code); };
      mount.appendChild(b);
    });
    injectStyle();
  }

  function injectStyle() {
    if (document.getElementById('wk-i18n-style')) return;
    var css =
      '.wk-lang{display:inline-flex;gap:4px;flex-wrap:wrap}' +
      '.wk-lang-btn{display:inline-flex;align-items:center;gap:5px;background:rgba(0,0,0,.28);' +
      'border:1px solid rgba(255,255,255,.18);color:#cfd6f0;border-radius:999px;padding:5px 11px;' +
      'font-size:13px;font-family:inherit;cursor:pointer;line-height:1;transition:all .15s}' +
      '.wk-lang-btn .wk-flag{font-size:15px}' +
      '.wk-lang-btn.on{background:linear-gradient(180deg,#ffcd4c,#ff8a3c);color:#1a1206;border-color:#ffcd4c;font-weight:800}' +
      '.wk-lang-btn:hover{border-color:#ffcd4c}' +
      '.wk-lang-btn.reserved{opacity:.5}' +
      '@media(max-width:560px){.wk-lang-btn .wk-name{display:none}.wk-lang-btn{padding:6px 9px}}';
    var st = document.createElement('style');
    st.id = 'wk-i18n-style';
    st.textContent = css;
    document.head.appendChild(st);
  }

  /* ---------- init ---------- */
  function init(opts) {
    opts = opts || {};
    if (opts.packs) state.config.packs = [].concat(opts.packs);
    if (opts.mount) state.config.mount = opts.mount;
    state.locale = detectInitial();
    // 始终加载回退语言以保证缺键时有兜底
    var toLoad = {};
    toLoad[state.locale] = true;
    toLoad[FALLBACK] = true;
    var jobs = Object.keys(toLoad).map(function (lc) { return loadLocale(lc, state.config.packs); });
    return Promise.all(jobs).then(function () {
      state.ready = true;
      document.documentElement.setAttribute('lang', state.locale);
      applyDOM();
      renderSwitcher();
      state.listeners.forEach(function (cb) { try { cb(state.locale); } catch (e) {} });
      return state.locale;
    });
  }

  /* ---------- registration API（单文件游戏可直接内联注册语言包，无需 fetch）---------- */
  function register(locale, dict) {
    state.loaded[locale] = state.loaded[locale] || {};
    deepMerge(state.loaded[locale], dict);
  }

  global.WukongI18n = {
    init: init,
    register: register,
    setLocale: setLocale,
    getLocale: function () { return state.locale; },
    supported: function () { return SUPPORTED.slice(); },
    t: t,
    applyDOM: applyDOM,
    onChange: onChange,
    renderSwitcher: renderSwitcher,
    isReady: function () { return state.ready; }
  };
  // 便捷全局别名（若未被占用）
  if (!global.t) global.t = t;

})(window);
