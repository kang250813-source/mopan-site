(function () {
  'use strict';

  var PIPS = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
  };

  function boot() {
    var rowEl = document.getElementById('dice-row');
    var totalEl = document.getElementById('dice-total');
    var countSel = document.getElementById('dice-count');
    var rollBtn = document.getElementById('dice-roll');
    if (!rowEl || !rollBtn || !window.MopanGames) return;

    var G = window.MopanGames;
    var rolling = false;

    function t(key, fallback) {
      return G.readI18n('games_' + key, fallback);
    }

    function fmt(template, n) {
      return String(template).replace('{n}', String(n));
    }

    function renderDie(value) {
      var die = document.createElement('div');
      die.className = 'mp-dice-die';
      var face = document.createElement('div');
      face.className = 'mp-dice-face';
      for (var i = 0; i < 9; i++) {
        var pip = document.createElement('span');
        pip.className = 'mp-dice-pip';
        if ((PIPS[value] || []).indexOf(i) >= 0) pip.classList.add('is-on');
        face.appendChild(pip);
      }
      die.appendChild(face);
      return die;
    }

    function renderDice(values) {
      rowEl.innerHTML = '';
      var sum = 0;
      values.forEach(function (v, idx) {
        var die = renderDie(v);
        die.style.animationDelay = (idx * 0.06) + 's';
        die.classList.add('is-landed');
        rowEl.appendChild(die);
        sum += v;
      });
      if (totalEl) {
        totalEl.textContent = values.length > 1
          ? fmt(t('dice_total', 'Total: {n}'), sum)
          : '';
      }
    }

    function roll() {
      if (rolling) return;
      var count = parseInt(countSel && countSel.value || '2', 10) || 2;
      rolling = true;
      rollBtn.disabled = true;
      countSel.disabled = true;
      rowEl.innerHTML = '';
      if (totalEl) totalEl.textContent = t('dice_rolling', 'Rolling…');

      var ticks = 0;
      var timer = setInterval(function () {
        var preview = [];
        for (var i = 0; i < count; i++) preview.push(1 + Math.floor(Math.random() * 6));
        renderDice(preview);
        rowEl.querySelectorAll('.mp-dice-die').forEach(function (el) {
          el.classList.remove('is-landed');
          el.classList.add('is-rolling');
        });
        ticks += 1;
        if (ticks >= 10) {
          clearInterval(timer);
          var finalVals = [];
          for (var j = 0; j < count; j++) finalVals.push(1 + Math.floor(Math.random() * 6));
          renderDice(finalVals);
          rolling = false;
          rollBtn.disabled = false;
          countSel.disabled = false;
        }
      }, 70);
    }

    rollBtn.addEventListener('click', roll);
    renderDice([1, 1]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
