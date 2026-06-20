(function () {
  'use strict';

  function boot() {
    var root = document.getElementById('home-site-wheel');
    var disc = document.getElementById('home-wheel-disc');
    var rotor = document.getElementById('home-wheel-rotor');
    var resultBox = document.getElementById('home-wheel-result');
    var resultCat = document.getElementById('home-wheel-result-cat');
    var resultLink = document.getElementById('home-wheel-result-link');
    var picksNode = document.getElementById('home-wheel-picks');
    if (!root || !disc || !rotor || !picksNode || !window.MopanGames) return;

    var G = window.MopanGames;
    var data = { segments: [], sites: [] };
    try {
      data = JSON.parse(picksNode.textContent || '{}');
    } catch (e) {
      data = { segments: [], sites: [] };
    }

    var segments = data.segments || [];
    var sites = data.sites || [];
    if (!segments.length || !sites.length) return;

    var rotation = 0;
    var spinning = false;
    var slice = 360 / segments.length;
    var cx = 60;
    var cy = 60;
    var r = 54;

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
        path.setAttribute('stroke-width', '1.5');
        rotor.appendChild(path);

        var labelPos = polar(mid, r * 0.58);
        var icon = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        icon.setAttribute('x', labelPos.x);
        icon.setAttribute('y', labelPos.y);
        icon.setAttribute('text-anchor', 'middle');
        icon.setAttribute('dominant-baseline', 'middle');
        icon.setAttribute('fill', '#fff');
        icon.setAttribute('font-size', '11');
        icon.textContent = seg.icon || '🌐';
        rotor.appendChild(icon);
      });

      var hub = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      hub.setAttribute('cx', cx);
      hub.setAttribute('cy', cy);
      hub.setAttribute('r', '12');
      hub.setAttribute('fill', '#fff');
      hub.setAttribute('stroke', 'rgba(193,44,66,0.2)');
      hub.setAttribute('stroke-width', '1.5');
      rotor.appendChild(hub);
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

    function pickForSegment(seg) {
      var label = seg.label || '';
      var pool = sites.filter(function (s) {
        return s.category === label;
      });
      return G.pickRandom(pool.length ? pool : sites) || sites[0];
    }

    function spin() {
      if (spinning) return;
      spinning = true;
      disc.disabled = true;
      disc.classList.add('is-spinning');
      if (resultBox) resultBox.hidden = true;

      var index = Math.floor(Math.random() * segments.length);
      var extra = 1440 + Math.floor(Math.random() * 360);
      var target = extra + (segments.length - index - 0.5) * slice;
      rotation += target;
      rotor.style.transform = 'rotate(' + rotation + 'deg)';

      window.setTimeout(function () {
        disc.classList.remove('is-spinning');
        spinning = false;
        disc.disabled = false;
        var seg = segments[index];
        var item = pickForSegment(seg);
        if (resultCat) resultCat.textContent = item.category || seg.label || '';
        if (resultLink) {
          resultLink.href = item.url || '#';
          resultLink.textContent = item.title || G.readI18n('ui_home_wheel_visit', 'Visit');
          if (isLocal(item.url)) {
            resultLink.target = '_self';
            resultLink.removeAttribute('rel');
          } else {
            resultLink.target = '_blank';
            resultLink.rel = 'noopener noreferrer';
          }
        }
        if (resultBox) {
          resultBox.hidden = false;
          resultBox.classList.remove('is-reveal');
          window.requestAnimationFrame(function () {
            resultBox.classList.add('is-reveal');
          });
        }
      }, 2800);
    }

    buildWheel();
    disc.addEventListener('click', spin);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
