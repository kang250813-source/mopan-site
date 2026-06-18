(function () {
  'use strict';

  var COLORS = ['#7c3aed', '#e11d48', '#0891b2', '#ca8a04', '#16a34a', '#db2777', '#2563eb', '#ea580c'];

  function boot() {
    var slotsEl = document.getElementById('finger-slots');
    var discEl = document.getElementById('finger-disc');
    var pointerEl = document.getElementById('finger-pointer');
    var spinBtn = document.getElementById('finger-spin');
    var resultEl = document.getElementById('finger-result');
    var countSel = document.getElementById('finger-count');
    if (!slotsEl || !spinBtn || !window.MopanGames) return;

    var G = window.MopanGames;
    var playerCount = 4;
    var spinning = false;
    var angle = 0;

    function t(key, fallback) {
      return G.readI18n('games_' + key, fallback);
    }

    function fmt(template, n) {
      return String(template).replace('{n}', String(n));
    }

    function buildSlots() {
      slotsEl.innerHTML = '';
      for (var i = 0; i < playerCount; i++) {
        var slot = document.createElement('div');
        slot.className = 'mp-finger-slot';
        slot.style.setProperty('--i', String(i));
        slot.style.setProperty('--n', String(playerCount));
        var label = document.createElement('span');
        label.textContent = String(i + 1);
        slot.appendChild(label);
        slot.style.background = COLORS[i % COLORS.length];
        slotsEl.appendChild(slot);
      }
    }

    function showResult(n) {
      if (!resultEl) return;
      resultEl.hidden = false;
      resultEl.textContent = fmt(t('finger_pick', 'Player {n} — your turn!'), n);
      resultEl.classList.remove('is-reveal');
      requestAnimationFrame(function () {
        resultEl.classList.add('is-reveal');
      });
    }

    function spin() {
      if (spinning) return;
      spinning = true;
      spinBtn.disabled = true;
      if (resultEl) resultEl.hidden = true;
      if (discEl) discEl.classList.add('is-spinning');

      var winner = Math.floor(Math.random() * playerCount);
      var slice = 360 / playerCount;
      var target = 360 * (4 + Math.random() * 2) + (360 - winner * slice - slice / 2);
      angle = target;
      if (pointerEl) {
        pointerEl.style.transition = 'transform 3.6s cubic-bezier(0.12, 0.84, 0.22, 1)';
        pointerEl.style.transform = 'translate(-50%, -100%) rotate(' + angle + 'deg)';
      }

      setTimeout(function () {
        spinning = false;
        spinBtn.disabled = false;
        if (discEl) discEl.classList.remove('is-spinning');
        showResult(winner + 1);
        G.showToast(fmt(t('finger_pick', 'Player {n} — your turn!'), winner + 1));
      }, 3700);
    }

    function resetLayout() {
      playerCount = parseInt(countSel && countSel.value || '4', 10) || 4;
      if (pointerEl) {
        pointerEl.style.transition = 'none';
        pointerEl.style.transform = 'translate(-50%, -100%) rotate(0deg)';
      }
      buildSlots();
      if (resultEl) resultEl.hidden = true;
    }

    spinBtn.addEventListener('click', spin);
    if (countSel) countSel.addEventListener('change', resetLayout);
    resetLayout();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
