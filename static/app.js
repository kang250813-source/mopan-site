(function () {
  'use strict';

  var MOBILE_RE = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

  function i18nDict() {
    var body = document.body;
    if (!body) return {};
    var raw = body.getAttribute('data-i18n');
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch (err) {
      return {};
    }
  }

  var I18N = i18nDict();

  var THEME_COLORS = {
    purple: '#5b21b6',
    ocean: '#0e7490',
    rose: '#be123c',
    forest: '#047857',
    amber: '#b45309',
    indigo: '#4338ca'
  };

  function applyTheme(theme) {
    var root = document.documentElement;
    if (!THEME_COLORS[theme]) theme = 'purple';
    root.setAttribute('data-theme', theme);
    localStorage.setItem('mopan-theme', theme);
    var meta = document.getElementById('meta-theme-color');
    if (meta) meta.setAttribute('content', THEME_COLORS[theme]);
    document.querySelectorAll('.mp-theme-btn').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-theme') === theme);
    });
  }

  function initTheme() {
    var saved = localStorage.getItem('mopan-theme') || 'purple';
    applyTheme(saved);
    document.querySelectorAll('.mp-theme-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        applyTheme(btn.getAttribute('data-theme') || 'purple');
      });
    });
  }

  function msg(key, fallback) {
    return (I18N && I18N[key]) || fallback || key;
  }

  function isMobile() {
    return MOBILE_RE.test(navigator.userAgent) || window.innerWidth < 768;
  }

  function showToast(message, type) {
    var toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = 'mp-toast mp-toast--visible' + (type ? ' mp-toast--' + type : '');
    toast.hidden = false;
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(function () {
      toast.className = 'mp-toast';
      toast.hidden = true;
    }, 3200);
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      try {
        if (document.execCommand('copy')) {
          resolve();
        } else {
          reject(new Error('execCommand failed'));
        }
      } catch (err) {
        reject(err);
      } finally {
        document.body.removeChild(ta);
      }
    });
  }

  function siteTitle() {
    var meta = document.querySelector('meta[name="site-title"]');
    return (meta && meta.getAttribute('content')) || '魔盘';
  }

  function resolveSharePageUrl(btn) {
    var fromBtn = (btn.getAttribute('data-share-page') || '').trim();
    if (fromBtn) return fromBtn;

    var meta = document.querySelector('meta[name="public-site-url"]');
    var publicRoot = meta ? meta.getAttribute('content') : '';
    if (publicRoot) {
      return publicRoot.replace(/\/$/, '') + window.location.pathname;
    }

    return window.location.href.split('#')[0];
  }

  function buildShareText(title, pageUrl, btn) {
    var kind = btn.getAttribute('data-share-kind') || 'resource';
    var quarkUrl = (btn.getAttribute('data-share-quark') || '').trim();
    var githubUrl = (btn.getAttribute('data-share-github') || '').trim();
    var label = kind === 'drama'
      ? siteTitle() + ' · ' + msg('site_drama', '夸克短剧')
      : siteTitle() + ' · ' + msg('site_resource', '站内资源');

    var lines = ['【' + title + '】' + label, '👉 ' + msg('share_page', '本页链接') + '：' + pageUrl];
    if (quarkUrl) lines.push('📦 ' + msg('share_quark', '夸克网盘') + '：' + quarkUrl);
    if (githubUrl) lines.push('📚 GitHub：' + githubUrl);
    return lines.join('\n');
  }

  function kindLabel(btn, title) {
    var kind = btn.getAttribute('data-share-kind') || 'resource';
    var suffix = kind === 'drama' ? msg('site_drama', '夸克短剧') : siteTitle();
    return title + ' - ' + suffix;
  }

  function markShared(btn) {
    btn.classList.add('is-shared');
    var label = btn.querySelector('.js-share-label');
    if (!label) return;
    if (!label.dataset.original) label.dataset.original = label.textContent;
    label.textContent = msg('copied_paste', msg('copied', '已复制'));
    setTimeout(function () {
      btn.classList.remove('is-shared');
      label.textContent = label.dataset.original || msg('share', '分享');
    }, 2200);
  }

  function sharePage(btn) {
    var title = btn.getAttribute('data-share-title') || document.title;
    var pageUrl = resolveSharePageUrl(btn);
    if (!pageUrl) {
      showToast(msg('no_share_url', '无法获取分享链接'), 'error');
      return Promise.reject(new Error('missing share url'));
    }

    var text = buildShareText(title, pageUrl, btn);

    function doneCopy() {
      markShared(btn);
      showToast(msg('share_copied_wechat', '分享文案已复制'), 'success');
    }

    function fallbackPrompt() {
      window.prompt(msg('prompt_copy', '请复制以下文案'), text);
      showToast(msg('copy_prompt', '请复制弹窗中的文案'), 'success');
    }

    if (!isMobile()) {
      return copyText(text).then(doneCopy).catch(fallbackPrompt);
    }

    if (navigator.share) {
      return navigator.share({
        title: kindLabel(btn, title),
        text: text,
      }).then(function () {
        showToast(msg('share_invoked', '已唤起分享'), 'success');
      }).catch(function (err) {
        if (err && err.name === 'AbortError') return;
        return copyText(text).then(doneCopy).catch(fallbackPrompt);
      });
    }

    return copyText(text).then(doneCopy).catch(fallbackPrompt);
  }

  function initShareButtons() {
    document.querySelectorAll('.js-share-page').forEach(function (btn) {
      if (btn.dataset.shareBound === '1') return;
      btn.dataset.shareBound = '1';
      btn.addEventListener('click', function () {
        sharePage(btn).catch(function () {
          showToast(msg('share_failed', '分享失败'), 'error');
        });
      });
    });
  }

  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy') || '';
      copyText(text).then(function () {
        var old = btn.textContent.trim();
        btn.textContent = msg('copied', '已复制');
        setTimeout(function () { btn.textContent = old; }, 1500);
      }).catch(function () {
        window.prompt(msg('copy_link', 'Copy link') || 'Copy link', text);
      });
    });
  });

  document.querySelectorAll('.js-open-pan').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var url = btn.getAttribute('data-pan-url');
      if (!url) {
        var panel = btn.closest('[data-pan-url]');
        url = panel && panel.getAttribute('data-pan-url');
      }
      if (url) window.open(url, '_blank', 'noopener');
    });
  });

  initShareButtons();
  initTheme();

  var dramaTagsList = document.getElementById('drama-tags-list');
  var dramaTagsToggle = document.getElementById('drama-tags-toggle');
  if (dramaTagsList && dramaTagsToggle) {
    var extraTags = dramaTagsList.querySelectorAll('.mp-drama-tag--extra');
    var expandLabel = dramaTagsToggle.getAttribute('data-expand') || msg('expand_more', 'Show more');
    var collapseLabel = dramaTagsToggle.getAttribute('data-collapse') || msg('collapse', 'Show less');
    var hasActiveExtra = Array.prototype.some.call(extraTags, function (tag) {
      return tag.classList.contains('is-active');
    });

    function setDramaTagsExpanded(expanded) {
      dramaTagsList.classList.toggle('is-expanded', expanded);
      dramaTagsToggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      dramaTagsToggle.textContent = expanded ? collapseLabel : expandLabel;
      extraTags.forEach(function (tag) {
        if (expanded) {
          tag.removeAttribute('hidden');
        } else {
          tag.setAttribute('hidden', '');
        }
      });
    }

    if (hasActiveExtra) {
      setDramaTagsExpanded(true);
    }

    dramaTagsToggle.addEventListener('click', function () {
      setDramaTagsExpanded(!dramaTagsList.classList.contains('is-expanded'));
    });
  }

  document.querySelectorAll('.article-body img').forEach(function (img) {
    if (img.closest('.mp-article-img-wrap')) return;
    var wrap = document.createElement('span');
    wrap.className = 'mp-article-img-wrap';
    img.parentNode.insertBefore(wrap, img);
    wrap.appendChild(img);
  });
})();
