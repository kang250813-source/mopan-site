(function () {
  'use strict';

  function boot() {
    var disc = document.getElementById('site-wheel-disc');
    var rotor = document.getElementById('site-wheel-rotor');
    var spinBtn = document.getElementById('site-wheel-spin');
    var resultBox = document.getElementById('site-wheel-result');
    var resultBadge = document.getElementById('site-wheel-result-badge');
    var resultLabel = document.getElementById('site-wheel-result-label');
    var resultTitle = document.getElementById('site-wheel-result-title');
    var resultHint = document.getElementById('site-wheel-result-hint');
    var resultLink = document.getElementById('site-wheel-result-link');
    var picksNode = document.getElementById('site-wheel-picks');
    if (!disc || !rotor || !spinBtn || !picksNode || !window.MopanGames) return;

    var G = window.MopanGames;
    var data = { segments: [] };
    try {
      data = JSON.parse(picksNode.textContent || '{}');
    } catch (e) {
      data = { segments: [] };
    }
    var segments = data.segments || [];
    if (!segments.length) return;

    var rotation = 0;
    var spinning = false;
    var slice = 360 / segments.length;
    var cx = 100;
    var cy = 100;
    var r = 92;

    function polar(angle, radius) {
      var rad = (angle - 90) * Math.PI / 180;
      return {
        x: cx + Math.cos(rad) * radius,
        y: cy + Math.sin(rad) * radius,
      };
    }

    function segmentPath(start, end) {
      var p1 = polar(start, r);
      var p2 = polar(end, r);
      var large = end - start > 180 ? 1 : 0;
      return [
        'M', cx, cy,
        'L', p1.x, p1.y,
        'A', r, r, 0, large, 1, p2.x, p2.y,
        'Z',
      ].join(' ');
    }

    function buildWheel() {
      rotor.innerHTML = '';
      segments.forEach(function (seg, i) {
        var start = i * slice;
        var end = start + slice;
        var mid = start + slice / 2;
        var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', segmentPath(start, end));
        path.setAttribute('fill', seg.color || '#7c3aed');
        path.setAttribute('stroke', '#fff');
        path.setAttribute('stroke-width', '2');
        rotor.appendChild(path);

        var labelPos = polar(mid, r * 0.62);
        var icon = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        icon.setAttribute('x', labelPos.x);
        icon.setAttribute('y', labelPos.y - 4);
        icon.setAttribute('text-anchor', 'middle');
        icon.setAttribute('fill', '#fff');
        icon.setAttribute('font-size', '15');
        icon.textContent = seg.icon || '🌐';
        rotor.appendChild(icon);

        var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', labelPos.x);
        text.setAttribute('y', labelPos.y + 12);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', '#fff');
        text.setAttribute('font-size', '8.5');
        text.setAttribute('font-weight', '700');
        var label = seg.label || '';
        text.textContent = label.length > 4 ? label.slice(0, 4) : label;
        rotor.appendChild(text);
      });

      var hub = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      hub.setAttribute('cx', cx);
      hub.setAttribute('cy', cy);
      hub.setAttribute('r', '18');
      hub.setAttribute('fill', '#fff');
      hub.setAttribute('stroke', 'rgba(91,33,182,0.25)');
      hub.setAttribute('stroke-width', '2');
      rotor.appendChild(hub);
    }

    function pickItem(seg) {
      return G.pickRandom(seg.items || []) || { title: seg.label, url: '#', hint: '' };
    }

    function isLocal(url) {
      if (!url || url === '#') return true;
      if (url.charAt(0) === '/') return true;
      try {
        var u = new URL(url, window.location.origin);
        return u.origin === window.location.origin;
      } catch (e) {
        return false;
      }
    }

    function spin() {
      if (spinning) return;
      spinning = true;
      spinBtn.disabled = true;
      spinBtn.classList.add('is-spinning');
      resultBox.hidden = true;
      disc.classList.add('is-spinning');

      var index = Math.floor(Math.random() * segments.length);
      var extra = 1800 + Math.floor(Math.random() * 360);
      var target = extra + (segments.length - index - 0.5) * slice;
      rotation += target;
      rotor.style.transform = 'rotate(' + rotation + 'deg)';

      window.setTimeout(function () {
        disc.classList.remove('is-spinning');
        spinBtn.classList.remove('is-spinning');
        spinning = false;
        spinBtn.disabled = false;
        var seg = segments[index];
        var item = pickItem(seg);
        if (resultBadge) {
          resultBadge.textContent = seg.icon || '🌐';
          resultBadge.style.background = seg.color || 'var(--mp-brand)';
        }
        if (resultLabel) resultLabel.textContent = seg.label;
        if (resultTitle) resultTitle.textContent = item.title;
        if (resultHint) {
          resultHint.textContent = item.hint || G.readI18n('games_site_wheel_result_hint', 'A handy site worth bookmarking.');
        }
        if (resultLink) {
          resultLink.href = item.url;
          resultLink.textContent = G.readI18n('games_site_open', 'Visit site');
          if (isLocal(item.url)) {
            resultLink.target = '_self';
            resultLink.removeAttribute('rel');
          } else {
            resultLink.target = '_blank';
            resultLink.rel = 'noopener noreferrer';
          }
        }
        resultBox.hidden = false;
        resultBox.classList.remove('is-reveal');
        window.requestAnimationFrame(function () {
          resultBox.classList.add('is-reveal');
        });
      }, 4200);
    }

    buildWheel();
    spinBtn.addEventListener('click', spin);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
