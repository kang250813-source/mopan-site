(function () {
  'use strict';

  var LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];

  function boot() {
    var boardEl = document.getElementById('tictactoe-board');
    if (!boardEl || !window.MopanGames) return;

    var G = window.MopanGames;
    var t = G.readI18n.bind(G);
    var turnEl = document.getElementById('tictactoe-turn');
    var statusEl = document.getElementById('tictactoe-status');
    var scoreXEl = document.getElementById('tictactoe-score-x');
    var scoreOEl = document.getElementById('tictactoe-score-o');
    var restartBtn = document.getElementById('tictactoe-restart');

    var board = Array(9).fill('');
    var current = 'X';
    var over = false;
    var scores = { X: 0, O: 0 };

    function fmt(template, vars) {
      var out = template;
      Object.keys(vars || {}).forEach(function (k) {
        out = out.replace(new RegExp('\\{' + k + '\\}', 'g'), String(vars[k]));
      });
      return out;
    }

    function tap() {
      if (G.vibrate) G.vibrate(12);
    }

    function winner() {
      for (var i = 0; i < LINES.length; i++) {
        var a = LINES[i][0];
        var b = LINES[i][1];
        var c = LINES[i][2];
        if (board[a] && board[a] === board[b] && board[b] === board[c]) {
          return { mark: board[a], line: LINES[i] };
        }
      }
      return null;
    }

    function full() {
      return board.every(function (cell) { return cell; });
    }

    function updateHud() {
      if (turnEl) turnEl.textContent = over ? '—' : current;
      if (scoreXEl) scoreXEl.textContent = String(scores.X);
      if (scoreOEl) scoreOEl.textContent = String(scores.O);
    }

    function highlightLine(line) {
      line.forEach(function (idx) {
        var btn = boardEl.querySelector('[data-cell="' + idx + '"]');
        if (btn) btn.classList.add('is-win');
      });
    }

    function render() {
      boardEl.innerHTML = '';
      board.forEach(function (mark, idx) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'mp-tictactoe-cell';
        if (mark === 'X') btn.classList.add('is-x');
        if (mark === 'O') btn.classList.add('is-o');
        btn.dataset.cell = String(idx);
        btn.setAttribute('aria-label', String(idx + 1));
        btn.textContent = mark;
        btn.disabled = over || !!mark;
        btn.addEventListener('click', function () { play(idx); });
        boardEl.appendChild(btn);
      });
      updateHud();
    }

    function endRound(result) {
      over = true;
      if (result.type === 'win') {
        scores[result.mark] += 1;
        highlightLine(result.line);
        if (statusEl) {
          statusEl.textContent = fmt(
            t('games_tictactoe_win', '{mark} wins!'),
            { mark: result.mark }
          );
        }
        tap();
      } else {
        if (statusEl) statusEl.textContent = t('games_tictactoe_draw', 'Draw');
      }
      updateHud();
    }

    function play(idx) {
      if (over || board[idx]) return;
      board[idx] = current;
      tap();
      var win = winner();
      if (win) {
        render();
        endRound({ type: 'win', mark: win.mark, line: win.line });
        return;
      }
      if (full()) {
        render();
        endRound({ type: 'draw' });
        return;
      }
      current = current === 'X' ? 'O' : 'X';
      if (statusEl) {
        statusEl.textContent = fmt(
          t('games_tictactoe_turn', '{mark} to play'),
          { mark: current }
        );
      }
      render();
    }

    function resetBoard() {
      board = Array(9).fill('');
      current = 'X';
      over = false;
      if (statusEl) statusEl.textContent = t('games_tictactoe_start', 'X goes first');
      render();
    }

    if (restartBtn) restartBtn.addEventListener('click', resetBoard);

    resetBoard();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
