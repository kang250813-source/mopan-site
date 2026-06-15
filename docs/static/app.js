(function () {
  'use strict';

  var MOBILE_RE = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

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
      ? siteTitle() + ' · 夸克短剧'
      : siteTitle() + ' · 站内资源';

    var lines = ['【' + title + '】' + label, '👉 本页链接：' + pageUrl];
    if (quarkUrl) lines.push('📦 夸克网盘：' + quarkUrl);
    if (githubUrl) lines.push('📚 GitHub：' + githubUrl);
    return lines.join('\n');
  }

  function kindLabel(btn, title) {
    var kind = btn.getAttribute('data-share-kind') || 'resource';
    var suffix = kind === 'drama' ? '夸克短剧' : siteTitle();
    return title + ' - ' + suffix;
  }

  function markShared(btn) {
    btn.classList.add('is-shared');
    var label = btn.querySelector('.js-share-label');
    if (!label) return;
    if (!label.dataset.original) label.dataset.original = label.textContent;
    label.textContent = label.textContent.indexOf('分享') >= 0 ? '已复制' : '已复制，去粘贴发送';
    setTimeout(function () {
      btn.classList.remove('is-shared');
      label.textContent = label.dataset.original || '分享';
    }, 2200);
  }

  function sharePage(btn) {
    var title = btn.getAttribute('data-share-title') || document.title;
    var pageUrl = resolveSharePageUrl(btn);
    if (!pageUrl) {
      showToast('无法获取分享链接', 'error');
      return Promise.reject(new Error('missing share url'));
    }

    var text = buildShareText(title, pageUrl, btn);

    function doneCopy() {
      markShared(btn);
      showToast('分享文案已复制，打开微信粘贴发送即可', 'success');
    }

    function fallbackPrompt() {
      window.prompt('请全选复制以下文案，粘贴到微信发给好友：', text);
      showToast('请复制弹窗中的文案', 'success');
    }

    // 桌面端：直接复制最可靠（微信无法从浏览器直接唤起）
    if (!isMobile()) {
      return copyText(text).then(doneCopy).catch(fallbackPrompt);
    }

    // 手机：优先系统分享，失败再复制
    if (navigator.share) {
      return navigator.share({
        title: kindLabel(btn, title),
        text: text,
      }).then(function () {
        showToast('已唤起分享', 'success');
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
          showToast('分享失败，请手动复制页面链接', 'error');
        });
      });
    });
  }

  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy') || '';
      copyText(text).then(function () {
        var old = btn.textContent.trim();
        btn.textContent = '已复制';
        setTimeout(function () { btn.textContent = old; }, 1500);
      }).catch(function () {
        window.prompt('复制链接', text);
      });
    });
  });

  document.querySelectorAll('.js-open-pan').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var panel = btn.closest('.cta-panel');
      var url = panel && panel.getAttribute('data-pan-url');
      if (url) window.open(url, '_blank', 'noopener');
    });
  });

  initShareButtons();

  var dramaTagsList = document.getElementById('drama-tags-list');
  var dramaTagsToggle = document.getElementById('drama-tags-toggle');
  if (dramaTagsList && dramaTagsToggle) {
    var extraTags = dramaTagsList.querySelectorAll('.mp-drama-tag--extra');
    var hasActiveExtra = Array.prototype.some.call(extraTags, function (tag) {
      return tag.classList.contains('is-active');
    });

    function setDramaTagsExpanded(expanded) {
      dramaTagsList.classList.toggle('is-expanded', expanded);
      dramaTagsToggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      dramaTagsToggle.textContent = expanded
        ? '收起'
        : '展开更多（' + extraTags.length + '）';
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
})();
