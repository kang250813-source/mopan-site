(function () {
  'use strict';

  var canvas = document.getElementById('civ-canvas');
  var toastEl = document.getElementById('civ-toast');
  var callbacks = { start: [], move: [], end: [], resize: [], hide: [], unload: [] };
  var toastTimer = null;

  function emit(type, event) {
    callbacks[type].forEach(function (callback) { callback(event); });
  }

  function touchEvent(event) {
    return {
      touches: event.touches,
      changedTouches: event.changedTouches
    };
  }

  function storageKey(key) {
    return 'mopan-' + key;
  }

  function showToast(options) {
    toastEl.textContent = options.title || '';
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-visible'); }, 1800);
  }

  function makeAudio() {
    var audio = new Audio();
    return {
      set src(value) { audio.src = value; },
      get src() { return audio.src; },
      set volume(value) { audio.volume = value; },
      get volume() { return audio.volume; },
      set obeyMuteSwitch(value) {},
      stop: function () { audio.pause(); audio.currentTime = 0; },
      seek: function (seconds) { audio.currentTime = seconds || 0; },
      play: function () { return audio.play().catch(function () {}); }
    };
  }

  window.wx = {
    createCanvas: function () { return canvas; },
    createImage: function () { return new Image(); },
    createInnerAudioContext: makeAudio,
    getSystemInfoSync: function () {
      return {
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        pixelRatio: window.devicePixelRatio || 1,
        safeArea: { top: 0, bottom: window.innerHeight }
      };
    },
    getStorageSync: function (key) {
      try {
        var value = localStorage.getItem(storageKey(key));
        return value ? JSON.parse(value) : '';
      } catch (error) { return ''; }
    },
    setStorageSync: function (key, value) {
      try { localStorage.setItem(storageKey(key), JSON.stringify(value)); } catch (error) {}
    },
    showToast: showToast,
    showModal: function (options) {
      var confirmed = window.confirm((options.title ? options.title + '\n\n' : '') + (options.content || ''));
      if (options.success) options.success({ confirm: confirmed, cancel: !confirmed });
    },
    vibrateShort: function () {
      if (navigator.vibrate) navigator.vibrate(12);
    },
    onTouchStart: function (callback) { callbacks.start.push(callback); },
    onTouchMove: function (callback) { callbacks.move.push(callback); },
    onTouchEnd: function (callback) { callbacks.end.push(callback); },
    onWindowResize: function (callback) { callbacks.resize.push(callback); },
    onHide: function (callback) { callbacks.hide.push(callback); },
    onUnload: function (callback) { callbacks.unload.push(callback); }
  };

  function pointerEvent(event, ended) {
    return { touches: ended ? [] : [event], changedTouches: [event] };
  }

  if (window.PointerEvent) {
    canvas.addEventListener('pointerdown', function (event) {
      event.preventDefault();
      canvas.setPointerCapture(event.pointerId);
      emit('start', pointerEvent(event, false));
    });
    canvas.addEventListener('pointermove', function (event) {
      if (!canvas.hasPointerCapture(event.pointerId)) return;
      event.preventDefault();
      emit('move', pointerEvent(event, false));
    });
    canvas.addEventListener('pointerup', function (event) {
      event.preventDefault();
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      emit('end', pointerEvent(event, true));
    });
    canvas.addEventListener('pointercancel', function (event) {
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
      emit('end', pointerEvent(event, true));
    });
  } else {
    canvas.addEventListener('touchstart', function (event) { event.preventDefault(); emit('start', touchEvent(event)); }, { passive: false });
    canvas.addEventListener('touchmove', function (event) { event.preventDefault(); emit('move', touchEvent(event)); }, { passive: false });
    canvas.addEventListener('touchend', function (event) { event.preventDefault(); emit('end', touchEvent(event)); }, { passive: false });
    canvas.addEventListener('mousedown', function (event) { emit('start', { touches: [event], changedTouches: [event] }); });
    window.addEventListener('mousemove', function (event) { if (event.buttons) emit('move', { touches: [event], changedTouches: [event] }); });
    window.addEventListener('mouseup', function (event) { emit('end', { touches: [], changedTouches: [event] }); });
  }
  window.addEventListener('resize', function () { emit('resize'); });
  window.addEventListener('pagehide', function () { emit('hide'); emit('unload'); });
}());
