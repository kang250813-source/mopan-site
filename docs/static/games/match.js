(function () {
  'use strict';

  function boot() {
    var board = document.getElementById('match-board');
    if (!board || !window.MopanGames) return;

    var G = window.MopanGames;
  var COLS = 7;
  var ROWS = 8;
  var TYPES = [
    { id: 'discover', icon: '🤖', cls: 'mp-match-cell--discover' },
    { id: 'drama', icon: '🎬', cls: 'mp-match-cell--drama' },
    { id: 'media', icon: '🎵', cls: 'mp-match-cell--media' },
    { id: 'k12', icon: '📚', cls: 'mp-match-cell--k12' },
    { id: 'ai', icon: '✨', cls: 'mp-match-cell--ai' },
    { id: 'pan', icon: '📀', cls: 'mp-match-cell--pan' },
  ];
  var MAX_MOVES = 30;

  var grid = [];
  var selected = null;
  var score = 0;
  var moves = MAX_MOVES;
  var busy = false;

  var scoreEl = document.getElementById('match-score');
  var movesEl = document.getElementById('match-moves');
  var bestEl = document.getElementById('match-best');
  var overlay = document.getElementById('match-overlay');
  var finalScore = document.getElementById('match-final-score');
  var bestFinal = document.getElementById('match-best-final');
  var overlayTitle = document.getElementById('match-overlay-title');
  var restartBtn = document.getElementById('match-restart');

  bestEl.textContent = String(G.getBest('match'));

  function randType() {
    return TYPES[Math.floor(Math.random() * TYPES.length)];
  }

  function idx(c, r) {
    return r * COLS + c;
  }

  function inBounds(c, r) {
    return c >= 0 && c < COLS && r >= 0 && r < ROWS;
  }

  function buildGrid() {
    grid = [];
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        var t;
        do {
          t = randType();
        } while (wouldMatch(c, r, t.id));
        grid.push(t);
      }
    }
  }

  function wouldMatch(c, r, typeId) {
    if (c >= 2) {
      var a = grid[idx(c - 1, r)];
      var b = grid[idx(c - 2, r)];
      if (a && b && a.id === typeId && b.id === typeId) return true;
    }
    if (r >= 2) {
      var c1 = grid[idx(c, r - 1)];
      var c2 = grid[idx(c, r - 2)];
      if (c1 && c2 && c1.id === typeId && c2.id === typeId) return true;
    }
    return false;
  }

  function render() {
    board.innerHTML = '';
    grid.forEach(function (cell, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mp-match-cell ' + cell.cls;
      btn.textContent = cell.icon;
      btn.dataset.index = String(i);
      btn.setAttribute('aria-label', cell.id);
      if (selected === i) btn.classList.add('is-selected');
      btn.addEventListener('click', onCellClick);
      board.appendChild(btn);
    });
    scoreEl.textContent = String(score);
    movesEl.textContent = String(moves);
  }

  function neighbors(i) {
    var c = i % COLS;
    var r = Math.floor(i / COLS);
    return [
      idx(c + 1, r),
      idx(c - 1, r),
      idx(c, r + 1),
      idx(c, r - 1),
    ].filter(function (n) { return n >= 0 && n < grid.length; });
  }

  function onCellClick(e) {
    if (busy || moves <= 0) return;
    var i = parseInt(e.currentTarget.dataset.index, 10);
    if (selected === null) {
      selected = i;
      render();
      return;
    }
    if (selected === i) {
      selected = null;
      render();
      return;
    }
    if (neighbors(selected).indexOf(i) < 0) {
      selected = i;
      render();
      return;
    }
    swapAndResolve(selected, i);
    selected = null;
  }

  function swap(a, b) {
    var tmp = grid[a];
    grid[a] = grid[b];
    grid[b] = tmp;
  }

  function findMatches() {
    var matched = {};
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        var id = grid[idx(c, r)].id;
        if (c <= COLS - 3) {
          if (grid[idx(c, r)].id === grid[idx(c + 1, r)].id && grid[idx(c, r)].id === grid[idx(c + 2, r)].id) {
            matched[idx(c, r)] = matched[idx(c + 1, r)] = matched[idx(c + 2, r)] = true;
          }
        }
        if (r <= ROWS - 3) {
          if (grid[idx(c, r)].id === grid[idx(c, r + 1)].id && grid[idx(c, r)].id === grid[idx(c, r + 2)].id) {
            matched[idx(c, r)] = matched[idx(c, r + 1)] = matched[idx(c, r + 2)] = true;
          }
        }
      }
    }
    return Object.keys(matched).map(function (k) { return parseInt(k, 10); });
  }

  function collapse() {
    for (var c = 0; c < COLS; c++) {
      var col = [];
      for (var r = ROWS - 1; r >= 0; r--) {
        var cell = grid[idx(c, r)];
        if (cell && !cell.empty) col.push(cell);
      }
      var missing = ROWS - col.length;
      for (var m = 0; m < missing; m++) col.push(randType());
      for (var r2 = 0; r2 < ROWS; r2++) {
        grid[idx(c, ROWS - 1 - r2)] = col[r2];
      }
    }
  }

  function markEmpty(indices) {
    indices.forEach(function (i) {
      grid[i] = { id: '', icon: '', cls: '', empty: true };
    });
  }

  function resolveMatches(chain) {
    var matches = findMatches();
    if (!matches.length) return 0;
    markEmpty(matches);
    var pts = matches.length * (10 + chain * 5);
    score += pts;
    collapse();
    return pts + resolveMatches(chain + 1);
  }

  function swapAndResolve(a, b) {
    busy = true;
    swap(a, b);
    var gained = resolveMatches(0);
    if (!gained) {
      swap(a, b);
      G.showToast(G.readI18n('games_no_match', 'No match'));
      busy = false;
      render();
      return;
    }
    moves -= 1;
    render();
    busy = false;
    if (moves <= 0) endGame(false);
    else if (!hasMoves()) endGame(true);
  }

  function hasMoves() {
    for (var i = 0; i < grid.length; i++) {
      var nbs = neighbors(i);
      for (var j = 0; j < nbs.length; j++) {
        swap(i, nbs[j]);
        var ok = findMatches().length > 0;
        swap(i, nbs[j]);
        if (ok) return true;
      }
    }
    return false;
  }

  function endGame(cleared) {
    var best = G.setBest('match', score);
    finalScore.textContent = String(score);
    bestFinal.textContent = String(best);
    overlayTitle.textContent = cleared
      ? G.readI18n('games_cleared', 'Cleared!')
      : G.readI18n('games_game_over', 'Game over');
    overlay.hidden = false;
  }

  function reset() {
    score = 0;
    moves = MAX_MOVES;
    selected = null;
    busy = false;
    overlay.hidden = true;
    var tries = 0;
    do {
      buildGrid();
      tries += 1;
    } while (!hasMoves() && tries < 12);
    render();
  }

  restartBtn.addEventListener('click', reset);
  reset();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
