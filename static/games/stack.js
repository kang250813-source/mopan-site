(function () {
  'use strict';

  function boot() {
    var canvas = document.getElementById('stack-canvas');
    var dropBtn = document.getElementById('stack-drop');
    if (!canvas || !window.MopanGames) return;

    var G = window.MopanGames;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var W = 360;
    var H = 520;
    var GROUND = H - 56;

    var scoreEl = document.getElementById('stack-score');
    var levelEl = document.getElementById('stack-level');
    var bestHud = document.getElementById('stack-best-hud');
    var overlay = document.getElementById('stack-overlay');
    var finalScore = document.getElementById('stack-final-score');
    var bestScore = document.getElementById('stack-best-score');
    var restartBtn = document.getElementById('stack-restart');

    var PAN_COLORS = ['#7c3aed', '#e11d48', '#0891b2', '#059669', '#d97706', '#4f46e5'];
    var PAN_LABELS = ['盘', '剧', '影', '学', 'AI', '藏'];

    var blocks = [];
    var active = null;
    var score = 0;
    var level = 1;
    var speed = 2.4;
    var dir = 1;
    var running = false;
    var animId = 0;
    var cameraY = 0;
    var started = false;

    function fitCanvas() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var cssW = canvas.clientWidth || W;
      var cssH = Math.round(cssW * (H / W));
      canvas.style.height = cssH + 'px';
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      ctx.setTransform(dpr * (cssW / W), 0, 0, dpr * (cssH / H), 0, 0);
    }

    function baseWidth() {
      return Math.max(72, 168 - (level - 1) * 7);
    }

    function paintRoundRect(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    function drawBlock(b) {
      var y = b.y + cameraY;
      paintRoundRect(b.x, y, b.w, b.h, 8);
      ctx.fillStyle = b.color;
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = 'bold 13px Inter, Noto Sans SC, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.label, b.x + b.w / 2, y + b.h / 2);
      paintRoundRect(b.x + 4, y + 4, b.w - 8, 8, 4);
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.fill();
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      var grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#faf5ff');
      grad.addColorStop(1, '#f4f4f5');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      blocks.forEach(drawBlock);
      if (active) drawBlock(active);

      if (!started) {
        ctx.fillStyle = 'rgba(24,24,27,0.55)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fff';
        ctx.font = '700 18px Inter, Noto Sans SC, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(G.readI18n('games_stack_start', '点击开始'), W / 2, H / 2 - 8);
        ctx.font = '500 12px Inter, Noto Sans SC, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillText(G.readI18n('games_stack_start_sub', '点画面或下方按钮落盘'), W / 2, H / 2 + 16);
      }

      ctx.fillStyle = 'rgba(91,33,182,0.35)';
      ctx.font = '600 11px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('mopan.lol', W - 14, H - 12);
    }

    function updateHud() {
      if (scoreEl) scoreEl.textContent = String(score);
      if (levelEl) levelEl.textContent = String(level);
      if (bestHud) bestHud.textContent = String(G.getBest('stack'));
    }

    function spawn() {
      var w = baseWidth();
      var idx = (level - 1) % PAN_COLORS.length;
      active = {
        x: 16,
        y: 70,
        w: w,
        h: 26,
        color: PAN_COLORS[idx],
        label: PAN_LABELS[idx],
        dropping: false,
        vy: 0,
      };
    }

    function reset() {
      cancelAnimationFrame(animId);
      var w0 = baseWidth();
      blocks = [{
        x: (W - w0) / 2,
        y: GROUND,
        w: w0,
        h: 28,
        color: PAN_COLORS[0],
        label: PAN_LABELS[0],
      }];
      score = 0;
      level = 1;
      speed = 2.4;
      dir = 1;
      cameraY = 0;
      started = true;
      spawn();
      updateHud();
      if (overlay) overlay.hidden = true;
      running = true;
      loop();
    }

    function begin() {
      if (!started) {
        started = true;
        return;
      }
      drop();
    }

    function drop() {
      if (!started || !active || active.dropping || !running) return;
      active.dropping = true;
      active.vy = 10;
    }

    function settle() {
      var prev = blocks[blocks.length - 1];
      var cur = active;
      var overlapLeft = Math.max(prev.x, cur.x);
      var overlapRight = Math.min(prev.x + prev.w, cur.x + cur.w);
      var overlap = overlapRight - overlapLeft;

      if (overlap < 10) {
        endGame();
        return;
      }

      var perfect = Math.abs(cur.x - prev.x) < 5 && Math.abs(cur.w - prev.w) < 5;
      cur.x = overlapLeft;
      cur.w = overlap;
      cur.y = prev.y - cur.h - 2;
      blocks.push(cur);

      score += Math.round(overlap) + (perfect ? 30 : 0);
      if (perfect) G.showToast(G.readI18n('games_perfect', 'Perfect!'));

      level += 1;
      speed = Math.min(6, speed + 0.14);

      var topY = cur.y + cameraY;
      if (topY < 110) {
        var shift = 110 - topY;
        cameraY += shift;
      }

      spawn();
      updateHud();
    }

    function endGame() {
      running = false;
      cancelAnimationFrame(animId);
      var best = G.setBest('stack', score);
      if (finalScore) finalScore.textContent = String(score);
      if (bestScore) bestScore.textContent = String(best);
      if (overlay) overlay.hidden = false;
      started = false;
    }

    function loop() {
      if (!running) return;
      if (active && !active.dropping) {
        active.x += speed * dir;
        if (active.x <= 12) dir = 1;
        if (active.x + active.w >= W - 12) dir = -1;
      } else if (active && active.dropping) {
        active.y += active.vy;
        active.vy += 0.72;
        var target = blocks[blocks.length - 1].y - active.h - 2;
        if (active.y >= target) {
          active.y = target;
          active.dropping = false;
          settle();
        }
      }
      draw();
      animId = requestAnimationFrame(loop);
    }

    function onPointer(e) {
      if (e.cancelable) e.preventDefault();
      begin();
    }

    fitCanvas();
    window.addEventListener('resize', fitCanvas);
    canvas.addEventListener('pointerdown', onPointer);
    if (dropBtn) dropBtn.addEventListener('click', begin);
    if (restartBtn) restartBtn.addEventListener('click', reset);
    window.addEventListener('keydown', function (e) {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        begin();
      }
    });

    if (bestHud) bestHud.textContent = String(G.getBest('stack'));
    blocks = [{
      x: (W - baseWidth()) / 2,
      y: GROUND,
      w: baseWidth(),
      h: 28,
      color: PAN_COLORS[0],
      label: PAN_LABELS[0],
    }];
    spawn();
    started = false;
    running = true;
    loop();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
