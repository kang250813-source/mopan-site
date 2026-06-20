(function () {
  'use strict';

  var PIPS = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
  };

  var PRIZE_KEYS = ['yixiu', 'erju', 'sijin', 'sanhong', 'duitang', 'zhuangyuan'];
  var PRIZE_MAX = {
    yixiu: 32,
    erju: 16,
    sijin: 8,
    sanhong: 4,
    duitang: 2,
    zhuangyuan: 1,
  };
  var LS_NAMES = 'mopan-bobing-names';

  function boot() {
    var diceEl = document.getElementById('bobing-dice');
    var resultEl = document.getElementById('bobing-result');
    var logEl = document.getElementById('bobing-log');
    var prizesEl = document.getElementById('bobing-prizes');
    var playerEl = document.getElementById('bobing-player');
    var roundEl = document.getElementById('bobing-round');
    var countSel = document.getElementById('bobing-count');
    var namesEl = document.getElementById('bobing-names');
    var rollBtn = document.getElementById('bobing-roll');
    var settleBtn = document.getElementById('bobing-settle');
    var restartBtn = document.getElementById('bobing-restart');
    var stageEl = document.getElementById('bobing-stage');
    if (!diceEl || !rollBtn || !window.MopanGames) return;

    var G = window.MopanGames;
    var rolling = false;
    var currentPlayer = 1;
    var playerCount = 4;
    var round = 1;
    var remaining = {};
    var contenders = [];
    var gameOver = false;

    function t(key, fallback) {
      return G.readI18n('games_' + key, fallback);
    }

    function fmt(template, vars) {
      var s = String(template);
      Object.keys(vars || {}).forEach(function (k) {
        s = s.split('{' + k + '}').join(String(vars[k]));
      });
      return s;
    }

    function defaultName(n) {
      return fmt(t('bobing_player_default', 'Player {n}'), { n: n });
    }

    function loadSavedNames() {
      try {
        var raw = localStorage.getItem(LS_NAMES);
        if (!raw) return null;
        var parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : null;
      } catch (e) {
        return null;
      }
    }

    function saveNames() {
      if (!namesEl) return;
      var names = [];
      for (var i = 1; i <= playerCount; i++) {
        names.push(getPlayerName(i));
      }
      try {
        localStorage.setItem(LS_NAMES, JSON.stringify(names));
      } catch (e) { /* ignore */ }
    }

    function getPlayerName(n) {
      if (!namesEl) return defaultName(n);
      var input = namesEl.querySelector('[data-player="' + n + '"]');
      var val = input && input.value ? input.value.trim() : '';
      return val || defaultName(n);
    }

    function setNamesDisabled(disabled) {
      if (!namesEl) return;
      namesEl.querySelectorAll('.mp-bobing-name-input').forEach(function (el) {
        el.disabled = disabled;
      });
    }

    function renderNameInputs() {
      if (!namesEl) return;
      var saved = loadSavedNames() || [];
      namesEl.innerHTML = '';
      for (var i = 1; i <= playerCount; i++) {
        var label = document.createElement('label');
        label.className = 'mp-bobing-name';
        var title = document.createElement('span');
        title.textContent = fmt(t('bobing_name_label', 'Player {n}'), { n: i });
        var input = document.createElement('input');
        input.type = 'text';
        input.maxLength = 8;
        input.dataset.player = String(i);
        input.className = 'mp-bobing-name-input';
        input.placeholder = t('bobing_name_ph', 'Name');
        input.value = (saved[i - 1] && String(saved[i - 1]).trim()) || defaultName(i);
        input.addEventListener('input', saveNames);
        label.appendChild(title);
        label.appendChild(input);
        namesEl.appendChild(label);
      }
      setNamesDisabled(rolling || gameOver);
    }

    function awardLabel(result) {
      if (!result) return t('bobing_miss', 'No prize');
      if (result.level === 'zhuangyuan') {
        return t('bobing_award_' + result.type, result.type);
      }
      return t('bobing_award_' + result.level, result.level);
    }

    function resetRemaining() {
      PRIZE_KEYS.forEach(function (k) {
        remaining[k] = PRIZE_MAX[k];
      });
    }

    function renderPrizes() {
      if (!prizesEl) return;
      prizesEl.innerHTML = '';
      PRIZE_KEYS.forEach(function (key) {
        var item = document.createElement('div');
        item.className = 'mp-bobing-prize';
        item.dataset.prize = key;
        var name = document.createElement('span');
        name.className = 'mp-bobing-prize-name';
        name.textContent = t('bobing_prize_' + key, key);
        var count = document.createElement('strong');
        count.textContent = String(remaining[key]);
        item.appendChild(name);
        item.appendChild(count);
        if (!remaining[key]) item.classList.add('is-empty');
        prizesEl.appendChild(item);
      });
    }

    function renderDie(value) {
      var die = document.createElement('div');
      die.className = 'mp-dice-die';
      if (value === 4) die.classList.add('is-red');
      var face = document.createElement('div');
      face.className = 'mp-dice-face';
      for (var i = 0; i < 9; i++) {
        var pip = document.createElement('span');
        pip.className = 'mp-dice-pip';
        if ((PIPS[value] || []).indexOf(i) >= 0) pip.classList.add('is-on');
        face.appendChild(pip);
      }
      die.appendChild(face);
      return die;
    }

    function renderDice(values) {
      diceEl.innerHTML = '';
      values.forEach(function (v, idx) {
        var die = renderDie(v);
        die.style.animationDelay = (idx * 0.05) + 's';
        die.classList.add('is-landed');
        diceEl.appendChild(die);
      });
    }

    function countValues(dice) {
      var counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
      dice.forEach(function (d) {
        counts[d] = (counts[d] || 0) + 1;
      });
      return counts;
    }

    function evaluate(dice) {
      var counts = countValues(dice);
      var fours = counts[4] || 0;
      var sorted = dice.slice().sort(function (a, b) { return a - b; });
      var maxCount = 0;
      var maxVal = 0;
      Object.keys(counts).forEach(function (k) {
        var n = parseInt(k, 10);
        if (counts[n] > maxCount) {
          maxCount = counts[n];
          maxVal = n;
        }
      });

      if (fours === 6) {
        return { level: 'zhuangyuan', type: 'six_red', rank: 100 };
      }
      if (fours === 4 && counts[1] === 2) {
        return { level: 'zhuangyuan', type: 'golden', rank: 95 };
      }
      if (fours === 5) {
        var other5 = dice.filter(function (d) { return d !== 4; })[0] || 0;
        return { level: 'zhuangyuan', type: 'five_red', rank: 90, tiebreak: other5 };
      }
      if (maxCount === 6 && maxVal !== 4) {
        return { level: 'zhuangyuan', type: 'six_black', rank: 85, tiebreak: maxVal };
      }
      if (maxCount === 5 && maxVal !== 4) {
        var otherK = dice.filter(function (d) { return d !== maxVal; })[0] || 0;
        return { level: 'zhuangyuan', type: 'five_kind', rank: 80, tiebreak: otherK, kind: maxVal };
      }
      if (fours === 4) {
        var others = dice.filter(function (d) { return d !== 4; });
        return {
          level: 'zhuangyuan',
          type: 'four_red',
          rank: 70,
          tiebreak: (others[0] || 0) + (others[1] || 0),
        };
      }
      if (sorted.join(',') === '1,2,3,4,5,6') {
        return { level: 'duitang', rank: 50 };
      }
      if (fours === 3) {
        return { level: 'sanhong', rank: 40 };
      }
      if (maxCount === 4 && maxVal !== 4) {
        return { level: 'sijin', rank: 30, kind: maxVal };
      }
      if (fours === 2) {
        return { level: 'erju', rank: 20 };
      }
      if (fours === 1) {
        return { level: 'yixiu', rank: 10 };
      }
      return null;
    }

    function compareZhuangyuan(a, b) {
      if (a.rank !== b.rank) return b.rank - a.rank;
      return (b.tiebreak || 0) - (a.tiebreak || 0);
    }

    function bestContender() {
      if (!contenders.length) return null;
      var best = contenders[0];
      for (var i = 1; i < contenders.length; i++) {
        if (compareZhuangyuan(contenders[i].result, best.result) > 0) {
          best = contenders[i];
        }
      }
      return best;
    }

    function nonZhuangyuanLeft() {
      return PRIZE_KEYS.slice(0, -1).some(function (k) {
        return remaining[k] > 0;
      });
    }

    function allPrizesGone() {
      return PRIZE_KEYS.every(function (k) {
        return remaining[k] <= 0;
      });
    }

    function addLog(text, kind) {
      if (!logEl) return;
      var row = document.createElement('p');
      row.className = 'mp-bobing-log-line' + (kind ? ' mp-bobing-log-line--' + kind : '');
      row.textContent = text;
      logEl.insertBefore(row, logEl.firstChild);
      while (logEl.children.length > 12) {
        logEl.removeChild(logEl.lastChild);
      }
    }

    function updateHud() {
      if (playerEl) playerEl.textContent = getPlayerName(currentPlayer);
      if (roundEl) roundEl.textContent = String(round);
      if (settleBtn) settleBtn.hidden = !contenders.length || gameOver || !remaining.zhuangyuan;
    }

    function nextPlayer() {
      currentPlayer += 1;
      if (currentPlayer > playerCount) {
        currentPlayer = 1;
        round += 1;
      }
      updateHud();
    }

    function setStatus(text) {
      if (resultEl) resultEl.textContent = text;
    }

    function maybeAutoSettle() {
      if (!contenders.length || !remaining.zhuangyuan || gameOver) return;
      if (!nonZhuangyuanLeft()) {
        settleZhuangyuan(true);
      }
    }

    function settleZhuangyuan(auto) {
      if (!remaining.zhuangyuan || !contenders.length || gameOver) return;
      var winner = bestContender();
      remaining.zhuangyuan = 0;
      renderPrizes();
      addLog(
        fmt(t('bobing_zhuangyuan_win', '{name} wins Zhuangyuan — {award}'), {
          name: getPlayerName(winner.player),
          award: awardLabel(winner.result),
        }),
        'zhuangyuan'
      );
      setStatus(fmt(t('bobing_zhuangyuan_win', '{name} wins Zhuangyuan — {award}'), {
        name: getPlayerName(winner.player),
        award: awardLabel(winner.result),
      }));
      G.showToast(fmt(t('bobing_zhuangyuan_win', '{name} wins Zhuangyuan — {award}'), {
        name: getPlayerName(winner.player),
        award: awardLabel(winner.result),
      }));
      if (G.hapticDiceRoll) G.hapticDiceRoll();
      contenders = [];
      if (settleBtn) settleBtn.hidden = true;
      if (allPrizesGone()) endGame();
    }

    function endGame() {
      gameOver = true;
      rollBtn.disabled = true;
      setNamesDisabled(true);
      setStatus(t('bobing_over', 'All prizes claimed — game over'));
      addLog(t('bobing_over', 'All prizes claimed — game over'), 'over');
    }

    function awardPrize(result, player) {
      var name = getPlayerName(player);
      if (!result) {
        setStatus(fmt(t('bobing_miss_turn', '{name} — no prize'), { name: name }));
        addLog(fmt(t('bobing_miss_turn', '{name} — no prize'), { name: name }));
        return;
      }

      if (result.level === 'zhuangyuan') {
        if (!remaining.zhuangyuan) {
          setStatus(fmt(t('bobing_sold_out', '{award} is gone'), { award: awardLabel(result) }));
          addLog(fmt(t('bobing_sold_out', '{award} is gone'), { award: awardLabel(result) }));
          return;
        }
        contenders.push({ player: player, result: result });
        setStatus(fmt(t('bobing_zhuangyuan_hold', '{name} — {award} (pending)'), {
          name: name,
          award: awardLabel(result),
        }));
        addLog(fmt(t('bobing_zhuangyuan_hold', '{name} — {award} (pending)'), {
          name: name,
          award: awardLabel(result),
        }), 'zhuangyuan');
        if (settleBtn) settleBtn.hidden = false;
        if (result.type === 'six_red') {
          settleZhuangyuan(true);
          return;
        }
        maybeAutoSettle();
        return;
      }

      if (!remaining[result.level]) {
        setStatus(fmt(t('bobing_sold_out', '{award} is gone'), { award: awardLabel(result) }));
        addLog(fmt(t('bobing_sold_out', '{award} is gone'), { award: awardLabel(result) }));
        return;
      }

      remaining[result.level] -= 1;
      renderPrizes();
      setStatus(fmt(t('bobing_win', '{name} — {award}!'), {
        name: name,
        award: awardLabel(result),
      }));
      addLog(fmt(t('bobing_win', '{name} — {award}!'), {
        name: name,
        award: awardLabel(result),
      }), result.level);
      if (result.level === 'sanhong' || result.level === 'duitang') {
        if (G.hapticDiceRoll) G.hapticDiceRoll();
      }
      maybeAutoSettle();
      if (allPrizesGone()) endGame();
    }

    function roll() {
      if (rolling || gameOver) return;
      rolling = true;
      rollBtn.disabled = true;
      if (countSel) countSel.disabled = true;
      if (restartBtn) restartBtn.disabled = true;
      setNamesDisabled(true);
      setStatus(t('bobing_rolling', 'Rolling six dice…'));
      if (G.primeHaptic) G.primeHaptic('bobing-dice-audio');
      if (G.playDiceBowl) G.playDiceBowl('tick');

      var ticks = 0;
      var timer = setInterval(function () {
        var preview = [];
        for (var i = 0; i < 6; i++) preview.push(1 + Math.floor(Math.random() * 6));
        renderDice(preview);
        diceEl.querySelectorAll('.mp-dice-die').forEach(function (el) {
          el.classList.remove('is-landed');
          el.classList.add('is-rolling');
        });
        if (ticks > 0 && ticks % 3 === 0 && G.playDiceBowl) G.playDiceBowl('tick');
        ticks += 1;
        if (ticks >= 12) {
          clearInterval(timer);
          var finalVals = [];
          for (var j = 0; j < 6; j++) finalVals.push(1 + Math.floor(Math.random() * 6));
          renderDice(finalVals);
          if (G.hapticDiceRoll) G.hapticDiceRoll();
          if (stageEl) {
            stageEl.classList.remove('is-shake');
            void stageEl.offsetWidth;
            stageEl.classList.add('is-shake');
          }
          var player = currentPlayer;
          var result = evaluate(finalVals);
          awardPrize(result, player);
          nextPlayer();
          rolling = false;
          rollBtn.disabled = gameOver;
          if (countSel) countSel.disabled = false;
          if (restartBtn) restartBtn.disabled = false;
          setNamesDisabled(gameOver);
        }
      }, 70);
    }

    function restart() {
      playerCount = parseInt(countSel && countSel.value || '4', 10) || 4;
      if (playerCount < 2) playerCount = 2;
      if (playerCount > 10) playerCount = 10;
      currentPlayer = 1;
      round = 1;
      contenders = [];
      gameOver = false;
      resetRemaining();
      renderPrizes();
      renderNameInputs();
      saveNames();
      if (logEl) logEl.innerHTML = '';
      if (settleBtn) settleBtn.hidden = true;
      rollBtn.disabled = false;
      setStatus(t('bobing_start', 'Pick players, then take turns rolling'));
      renderDice([1, 2, 3, 4, 5, 6]);
      updateHud();
    }

    function onCountChange() {
      if (rolling) return;
      saveNames();
      playerCount = parseInt(countSel && countSel.value || '4', 10) || 4;
      if (playerCount < 2) playerCount = 2;
      if (playerCount > 10) playerCount = 10;
      if (currentPlayer > playerCount) currentPlayer = 1;
      renderNameInputs();
      saveNames();
      updateHud();
    }

    rollBtn.addEventListener('click', roll);
    if (settleBtn) settleBtn.addEventListener('click', function () { settleZhuangyuan(false); });
    if (restartBtn) restartBtn.addEventListener('click', restart);
    if (countSel) {
      countSel.addEventListener('change', onCountChange);
    }
    if (rollBtn && G.primeHaptic) {
      rollBtn.addEventListener('pointerdown', function () {
        G.primeHaptic('bobing-dice-audio');
      }, { passive: true });
    }

    restart();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
