(function () {
  'use strict';

  var MIN = 1;
  var MAX = 100;

  function boot() {
    var rangeEl = document.getElementById('bomb-range');
    var statusEl = document.getElementById('bomb-status');
    var guessEl = document.getElementById('bomb-guess');
    var goBtn = document.getElementById('bomb-go');
    var historyEl = document.getElementById('bomb-history');
    var restartBtn = document.getElementById('bomb-restart');
    if (!guessEl || !window.MopanGames) return;

    var G = window.MopanGames;
    var low = MIN;
    var high = MAX;
    var bomb = 0;
    var over = false;

    function t(key, fallback) {
      return G.readI18n('games_' + key, fallback);
    }

    function fmt(template, parts) {
      var out = template;
      Object.keys(parts).forEach(function (k) {
        out = out.replace('{' + k + '}', String(parts[k]));
      });
      return out;
    }

    function updateRange() {
      if (rangeEl) rangeEl.textContent = low + ' – ' + high;
      guessEl.min = String(low);
      guessEl.max = String(high);
      guessEl.placeholder = '?';
    }

    function setStatus(msg) {
      if (statusEl) statusEl.textContent = msg;
    }

    function addHistory(text, kind) {
      if (!historyEl) return;
      var item = document.createElement('p');
      item.className = 'mp-bomb-log' + (kind ? ' mp-bomb-log--' + kind : '');
      item.textContent = text;
      historyEl.prepend(item);
    }

    function reset() {
      low = MIN;
      high = MAX;
      bomb = low + Math.floor(Math.random() * (high - low + 1));
      over = false;
      if (historyEl) historyEl.innerHTML = '';
      guessEl.value = '';
      guessEl.disabled = false;
      if (goBtn) goBtn.disabled = false;
      updateRange();
      setStatus(t('bomb_start', 'Guess a number — hit the bomb and you lose'));
      guessEl.focus();
    }

    function submitGuess() {
      if (over) return;
      var raw = parseInt(String(guessEl.value || '').trim(), 10);
      if (!Number.isFinite(raw)) {
        G.showToast(t('bomb_invalid', 'Enter a number in range'));
        return;
      }
      if (raw < low || raw > high) {
        G.showToast(fmt(t('bomb_out', 'Stay between {low} and {high}'), { low: low, high: high }));
        return;
      }

      if (raw === bomb) {
        over = true;
        guessEl.disabled = true;
        if (goBtn) goBtn.disabled = true;
        setStatus(fmt(t('bomb_boom', 'Boom! The bomb was {n}'), { n: bomb }));
        addHistory(fmt(t('bomb_boom', 'Boom! The bomb was {n}'), { n: bomb }), 'boom');
        G.showToast(t('bomb_boom_short', 'Boom!'));
        return;
      }

      if (raw < bomb) {
        low = raw + 1;
        addHistory(fmt(t('bomb_low', '{n} — too low'), { n: raw }), 'low');
      } else {
        high = raw - 1;
        addHistory(fmt(t('bomb_high', '{n} — too high'), { n: raw }), 'high');
      }

      guessEl.value = '';
      updateRange();
      setStatus(t('bomb_again', 'Keep guessing — narrow the range'));
      guessEl.focus();
    }

    if (goBtn) goBtn.addEventListener('click', submitGuess);
    if (restartBtn) restartBtn.addEventListener('click', reset);
    guessEl.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') submitGuess();
    });
    reset();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
