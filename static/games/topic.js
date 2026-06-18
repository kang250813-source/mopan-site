(function () {
  'use strict';

  var TOPICS_ZH = [
    '今天最开心的一件事？',
    '这周你想吃啥？我来做/点',
    '最近学到的一个新本领',
    '如果周末只有半天，你想干嘛？',
    '说一个感谢家人的理由',
    '你心中的「完美一天」长什么样？',
    '家里最想改进的一件小事',
    '分享一个搞笑瞬间',
    '今年最想完成的小目标',
    '如果换一天当家长，你会定什么家规？',
    '你最骄傲的一次努力',
    '想对家人说但还没说出口的话',
  ];
  var TOPICS_EN = [
    'Best part of your day?',
    'What should we eat this week?',
    'Something new you learned lately',
    'Perfect half-day weekend plan?',
    'One reason to thank family today',
    'What does a perfect day look like?',
    'One small thing to improve at home',
    'Share a funny moment',
    'A small goal for this year',
    'If you were parent for a day, what rule would you make?',
    'A time you felt proud of your effort',
    'Something you want to tell family but haven\'t yet',
  ];

  function boot() {
    if (!window.MopanGames) return;
    var G = window.MopanGames;
    var card = document.getElementById('topic-card');
    var textEl = document.getElementById('topic-text');
    var drawBtn = document.getElementById('topic-draw');
    var locale = (document.body.getAttribute('data-locale') || 'zh');

    var topics = locale === 'en' ? TOPICS_EN : TOPICS_ZH;
    var last = -1;

    function t(key, fallback) {
      return G.readI18n('games_' + key, fallback);
    }

    function draw() {
      if (!topics.length) return;
      var idx;
      do {
        idx = Math.floor(Math.random() * topics.length);
      } while (topics.length > 1 && idx === last);
      last = idx;
      if (textEl) textEl.textContent = topics[idx];
      if (card) {
        card.classList.remove('is-flip');
        void card.offsetWidth;
        card.classList.add('is-flip');
      }
    }

    if (drawBtn) drawBtn.addEventListener('click', draw);
    if (textEl) textEl.textContent = t('topic_ready', '点按钮抽一张话题卡');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
