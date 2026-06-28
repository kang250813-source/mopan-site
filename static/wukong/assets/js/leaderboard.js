/*!
 * WukongLeaderboard — 全站共享的全球排行榜模块（基于 Supabase REST）
 * 纯前端直连，anon key 公开可见（受 RLS 保护：仅可读 + 可插入）。
 * 容错：连不上时所有方法 reject/返回空，调用方应降级到本地榜，绝不白屏。
 *
 * 用法：
 *   WukongLeaderboard.submit({ board:'civ', name:'大圣', score:12345, era:3 })
 *   WukongLeaderboard.top({ board:'civ', limit:100 }).then(rows => ...)
 *   WukongLeaderboard.playerId()   // 稳定的本地随机ID（清缓存会变，可接受）
 *   WukongLeaderboard.nickname()/setNickname(n)
 */
(function (global) {
  'use strict';

  var URL = 'https://nteyvfpfwevlsszcmzsa.supabase.co';
  var ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50ZXl2ZnBmd2V2bHNzemNtenNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2NDQ1ODYsImV4cCI6MjA5ODIyMDU4Nn0.rr5I6kN3XVWgCkY2vxCZs6pGg9ieftIf5PM4P7luzTI';
  var REST = URL + '/rest/v1/leaderboard';
  var TIMEOUT = 8000;

  var configured = !!(URL && ANON && URL.indexOf('supabase.co') > 0);

  function headers(extra) {
    var h = { apikey: ANON, Authorization: 'Bearer ' + ANON };
    if (extra) for (var k in extra) h[k] = extra[k];
    return h;
  }

  function withTimeout(promise, ms) {
    return new Promise(function (resolve, reject) {
      var t = setTimeout(function () { reject(new Error('timeout')); }, ms || TIMEOUT);
      promise.then(function (v) { clearTimeout(t); resolve(v); },
                   function (e) { clearTimeout(t); reject(e); });
    });
  }

  /* stable-ish local player id (clearing storage resets it — acceptable) */
  function playerId() {
    var id = null;
    try { id = localStorage.getItem('wukong-pid'); } catch (e) {}
    if (!id) {
      id = 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      try { localStorage.setItem('wukong-pid', id); } catch (e) {}
    }
    return id;
  }
  function nickname() {
    try { return localStorage.getItem('wukong-nick') || ''; } catch (e) { return ''; }
  }
  function setNickname(n) {
    try { localStorage.setItem('wukong-nick', (n || '').slice(0, 16)); } catch (e) {}
  }

  /* fetch top N, ordered by score desc */
  function top(opts) {
    opts = opts || {};
    if (!configured) return Promise.reject(new Error('not-configured'));
    var limit = opts.limit || 100;
    var url = REST + '?select=name,score,era,player_id,created_at'
            + '&order=score.desc&limit=' + limit;
    return withTimeout(fetch(url, { headers: headers() }).then(function (r) {
      if (!r.ok) throw new Error('http ' + r.status);
      return r.json();
    }), opts.timeout);
  }

  /* submit a score (insert-only; client dedupes by player_id for display) */
  function submit(opts) {
    if (!configured) return Promise.reject(new Error('not-configured'));
    var body = {
      name: (opts.name || nickname() || 'Anonymous').slice(0, 16),
      score: Math.max(0, Math.floor(opts.score || 0)),
      era: opts.era || 0,
      player_id: opts.playerId || playerId()
    };
    return withTimeout(fetch(REST, {
      method: 'POST',
      headers: headers({ 'Content-Type': 'application/json', Prefer: 'return=minimal' }),
      body: JSON.stringify(body)
    }).then(function (r) {
      if (!r.ok) throw new Error('http ' + r.status);
      return true;
    }), opts.timeout);
  }

  /* dedupe rows to each player's best score, then re-rank */
  function dedupeBest(rows) {
    var best = {};
    rows.forEach(function (r) {
      var k = r.player_id || (r.name + ':' + r.score);
      if (!best[k] || r.score > best[k].score) best[k] = r;
    });
    var out = Object.keys(best).map(function (k) { return best[k]; });
    out.sort(function (a, b) { return b.score - a.score; });
    return out;
  }

  global.WukongLeaderboard = {
    configured: configured,
    top: top,
    submit: submit,
    dedupeBest: dedupeBest,
    playerId: playerId,
    nickname: nickname,
    setNickname: setNickname
  };
})(window);
