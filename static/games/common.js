(function () {
  'use strict';

  function readI18n(key, fallback) {
    try {
      var raw = document.body.getAttribute('data-i18n');
      if (!raw) return fallback;
      var map = JSON.parse(raw);
      return map[key] || fallback;
    } catch (e) {
      return fallback;
    }
  }

  function bestKey(name) {
    return 'mopan-game-best-' + name;
  }

  function getBest(name) {
    var v = parseInt(localStorage.getItem(bestKey(name)) || '0', 10);
    return Number.isFinite(v) ? v : 0;
  }

  function setBest(name, score) {
    var prev = getBest(name);
    if (score > prev) {
      localStorage.setItem(bestKey(name), String(score));
      return score;
    }
    return prev;
  }

  function showToast(msg) {
    var el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () { el.hidden = true; }, 1800);
  }

  function pickRandom(arr) {
    if (!arr || !arr.length) return null;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  window.MopanGames = {
    readI18n: readI18n,
    getBest: getBest,
    setBest: setBest,
    showToast: showToast,
    pickRandom: pickRandom,
  };
})();
