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

  var _audioCtx = null;
  var _biteAudio = null;

  function isWeChat() {
    return /MicroMessenger/i.test(navigator.userAgent || '');
  }

  function isIOS() {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent || '')
      || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  function primeHaptic() {
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        if (!_audioCtx) _audioCtx = new AC();
        if (_audioCtx.state === 'suspended') _audioCtx.resume();
      }
      if (!_biteAudio) {
        _biteAudio = document.getElementById('croc-bite-audio');
        if (!_biteAudio) {
          _biteAudio = new Audio();
          _biteAudio.preload = 'auto';
          _biteAudio.setAttribute('playsinline', '');
          _biteAudio.setAttribute('webkit-playsinline', '');
        }
      }
      if (_biteAudio && _biteAudio.src) {
        _biteAudio.load();
      }
    } catch (e) { /* ignore */ }
  }

  function playBiteClip(strong) {
    try {
      if (!_biteAudio) _biteAudio = document.getElementById('croc-bite-audio');
      if (!_biteAudio) return false;
      _biteAudio.volume = strong ? 1 : 0.75;
      _biteAudio.currentTime = 0;
      var ret = _biteAudio.play();
      if (ret && typeof ret.catch === 'function') {
        ret.catch(function () {});
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  function audioBuzz(strong) {
    if (isWeChat() || isIOS()) {
      if (playBiteClip(strong)) return;
    }
    try {
      primeHaptic();
      if (!_audioCtx) return;
      var t0 = _audioCtx.currentTime;
      var osc = _audioCtx.createOscillator();
      var gain = _audioCtx.createGain();
      var dur = strong ? 0.22 : 0.14;
      osc.type = 'square';
      osc.frequency.setValueAtTime(strong ? 58 : 95, t0);
      osc.frequency.exponentialRampToValueAtTime(strong ? 32 : 70, t0 + dur);
      gain.gain.setValueAtTime(strong ? 0.42 : 0.18, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      osc.connect(gain);
      gain.connect(_audioCtx.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    } catch (e) { /* ignore */ }
  }

  function vibrate(pattern) {
    try {
      if (!navigator || typeof navigator.vibrate !== 'function') return false;
      navigator.vibrate(0);
      return !!navigator.vibrate(pattern);
    } catch (e) {
      return false;
    }
  }

  /** Bite feedback: vibrate (Android/部分微信), audio + shake fallback */
  function hapticBite() {
    var buzzed = false;
    if (!isIOS()) {
      buzzed = vibrate([150, 80, 250, 80, 380]);
      if (!buzzed) buzzed = vibrate(420);
      if (!buzzed && isWeChat()) buzzed = vibrate(260);
    }
    if (!playBiteClip(!buzzed)) audioBuzz(!buzzed);
  }

  window.MopanGames = {
    readI18n: readI18n,
    getBest: getBest,
    setBest: setBest,
    showToast: showToast,
    pickRandom: pickRandom,
    vibrate: vibrate,
    primeHaptic: primeHaptic,
    hapticBite: hapticBite,
  };
})();
