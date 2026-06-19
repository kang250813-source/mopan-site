(function () {
  'use strict';

  var TOOTH_COUNT = 13;

  function boot() {
    var teethEl = document.getElementById('croc-teeth');
    var headEl = document.getElementById('croc-head');
    var mouthEl = document.getElementById('croc-mouth');
    var statusEl = document.getElementById('croc-status');
    var playerEl = document.getElementById('croc-player');
    var leftEl = document.getElementById('croc-left');
    var countSel = document.getElementById('croc-player-count');
    var restartBtn = document.getElementById('croc-restart');
    var stageEl = document.getElementById('croc-stage');
    if (!teethEl || !window.MopanGames) return;

    var G = window.MopanGames;
    var badTooth = -1;
    var currentPlayer = 1;
    var playerCount = 4;
    var over = false;
    var removed = 0;

    function t(key, fallback) {
      return G.readI18n('games_' + key, fallback);
    }

    function fmt(template, n) {
      return String(template).replace('{n}', String(n));
    }

    function updateHud() {
      if (playerEl) playerEl.textContent = String(currentPlayer);
      if (leftEl) leftEl.textContent = String(TOOTH_COUNT - removed);
    }

    function setStatus(msg) {
      if (statusEl) statusEl.textContent = msg;
    }

    function buildTeeth() {
      teethEl.innerHTML = '';
      for (var i = 0; i < TOOTH_COUNT; i++) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'mp-croc-tooth';
        btn.dataset.index = String(i);
        btn.setAttribute('aria-label', String(i + 1));
        btn.addEventListener('pointerdown', onToothPrime, { passive: true });
        btn.addEventListener('pointerup', onToothActivate);
        teethEl.appendChild(btn);
      }
    }

    function onToothPrime() {
      if (G.primeHaptic) G.primeHaptic();
    }

    function onToothActivate(ev) {
      if (ev.pointerType === 'mouse' && ev.button !== 0) return;
      onToothClick(ev);
    }

    function shakeStage() {
      if (!stageEl) return;
      stageEl.classList.remove('is-shake');
      void stageEl.offsetWidth;
      stageEl.classList.add('is-shake');
    }

    function reset() {
      over = false;
      removed = 0;
      currentPlayer = 1;
      playerCount = parseInt(countSel && countSel.value || '4', 10) || 4;
      badTooth = Math.floor(Math.random() * TOOTH_COUNT);
      if (headEl) headEl.classList.remove('is-bite');
      if (mouthEl) mouthEl.classList.remove('is-open');
      buildTeeth();
      updateHud();
      setStatus(fmt(t('croc_turn', 'Player {n} — pick a tooth'), currentPlayer));
      if (countSel) countSel.disabled = false;
    }

    function onToothClick(ev) {
      if (over) return;
      var btn = ev.currentTarget;
      if (!btn || btn.disabled) return;
      var idx = parseInt(btn.dataset.index || '-1', 10);
      if (idx < 0) return;

      btn.disabled = true;
      btn.classList.add('is-picked');

      if (idx === badTooth) {
        if (G.hapticBite) G.hapticBite();
        shakeStage();
        over = true;
        btn.classList.add('is-bad');
        if (headEl) headEl.classList.add('is-bite');
        if (mouthEl) mouthEl.classList.add('is-open');
        setStatus(fmt(t('croc_lose', 'Player {n} got bitten!'), currentPlayer));
        teethEl.querySelectorAll('.mp-croc-tooth').forEach(function (el) {
          el.disabled = true;
        });
        if (countSel) countSel.disabled = false;
        G.showToast(fmt(t('croc_lose', 'Player {n} got bitten!'), currentPlayer));
        return;
      }

      removed += 1;
      btn.classList.add('is-out');
      updateHud();

      if (removed >= TOOTH_COUNT - 1) {
        over = true;
        setStatus(t('croc_safe', 'Lucky round — no one got bitten'));
        if (countSel) countSel.disabled = false;
        return;
      }

      currentPlayer = currentPlayer >= playerCount ? 1 : currentPlayer + 1;
      updateHud();
      setStatus(fmt(t('croc_turn', 'Player {n} — pick a tooth'), currentPlayer));
    }

    if (restartBtn) restartBtn.addEventListener('click', reset);
    if (countSel) countSel.addEventListener('change', reset);
    reset();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
