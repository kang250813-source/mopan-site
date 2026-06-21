(function () {
  'use strict';

  var grid = document.querySelector('.mp-drama-grid[data-drama-daily]');
  if (!grid) return;

  function dailySeed() {
    var now = new Date();
    var bj = new Date(now.getTime() + (now.getTimezoneOffset() + 480) * 60000);
    var y = bj.getFullYear();
    var m = bj.getMonth() + 1;
    var d = bj.getDate();
    return y * 10000 + m * 100 + d;
  }

  function mulberry32(seed) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffleCards(seed) {
    var cards = Array.prototype.slice.call(grid.querySelectorAll('.mp-drama-card'));
    if (cards.length < 2) return;

    var items = cards.map(function (el) {
      return {
        el: el,
        id: parseInt(el.getAttribute('data-drama-id') || '0', 10)
      };
    });
    items.sort(function (a, b) {
      return a.id - b.id;
    });

    var rng = mulberry32(seed);
    for (var i = items.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var tmp = items[i];
      items[i] = items[j];
      items[j] = tmp;
    }

    items.forEach(function (item) {
      grid.appendChild(item.el);
    });
  }

  function msUntilNextBeijingDay() {
    var now = new Date();
    var bj = new Date(now.getTime() + (now.getTimezoneOffset() + 480) * 60000);
    var next = new Date(bj.getFullYear(), bj.getMonth(), bj.getDate() + 1);
    var nextUtc = next.getTime() - 480 * 60000 + now.getTimezoneOffset() * 60000;
    return Math.max(1000, nextUtc - now.getTime() + 100);
  }

  shuffleCards(dailySeed());
  window.setTimeout(function () {
    window.location.reload();
  }, msUntilNextBeijingDay());
})();
