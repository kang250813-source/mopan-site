(function () {
  'use strict';

  var feed = document.querySelector('.mp-feed[data-classics-hourly]');
  if (!feed) return;

  function hourSeed() {
    return Math.floor(Date.now() / 3600000);
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
    var cards = Array.prototype.slice.call(feed.querySelectorAll('.mp-card'));
    if (cards.length < 2) return;

    var items = cards.map(function (el) {
      return {
        el: el,
        id: parseInt(el.getAttribute('data-resource-id') || '0', 10)
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
      feed.appendChild(item.el);
    });
  }

  function msUntilNextHour() {
    return 3600000 - (Date.now() % 3600000) + 100;
  }

  shuffleCards(hourSeed());
  window.setTimeout(function () {
    window.location.reload();
  }, msUntilNextHour());
})();
