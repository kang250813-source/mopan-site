(function () {
  'use strict';

  var DEFAULT_MEMBERS = ['爸爸', '妈妈', '哥哥', '妹妹'];
  var DEFAULT_CHORES = ['洗碗', '扫地', '拖地', '倒垃圾', '晾衣服', '擦桌子', '整理客厅', '喂宠物'];
  var LS_MEMBERS = 'mopan-family-members';
  var LS_CHORES = 'mopan-family-chores';

  function boot() {
    if (!window.MopanGames || !window.MopanFamilyWheel) return;

    var G = window.MopanGames;
    var membersEl = document.getElementById('chore-members');
    var choresEl = document.getElementById('chore-chores');
    var memberInput = document.getElementById('chore-member-input');
    var choreInput = document.getElementById('chore-chore-input');
    var memberAdd = document.getElementById('chore-member-add');
    var choreAdd = document.getElementById('chore-chore-add');
    var spinBtn = document.getElementById('chore-spin');
    var resultEl = document.getElementById('chore-result');
    var resultChore = document.getElementById('chore-result-chore');
    var resultWho = document.getElementById('chore-result-who');

    var members = loadList(LS_MEMBERS, DEFAULT_MEMBERS);
    var chores = loadList(LS_CHORES, DEFAULT_CHORES);

    var choreWheel = new window.MopanFamilyWheel({
      discId: 'chore-wheel-disc',
      rotorId: 'chore-wheel-rotor',
      segments: toSegments(chores),
    });
    var whoWheel = new window.MopanFamilyWheel({
      discId: 'who-wheel-disc',
      rotorId: 'who-wheel-rotor',
      segments: toSegments(members),
    });

    function t(key, fallback) {
      return G.readI18n('games_' + key, fallback);
    }

    function fmt(template, parts) {
      var out = template;
      Object.keys(parts).forEach(function (k) {
        out = out.replace('{' + k + '}', String(parts[k]));
      });
      return out;
    }

    function loadList(key, fallback) {
      try {
        var raw = localStorage.getItem(key);
        if (!raw) return fallback.slice();
        var arr = JSON.parse(raw);
        return Array.isArray(arr) && arr.length ? arr : fallback.slice();
      } catch (e) {
        return fallback.slice();
      }
    }

    function saveList(key, arr) {
      localStorage.setItem(key, JSON.stringify(arr));
    }

    function toSegments(labels) {
      return labels.map(function (label, i) {
        return {
          label: label,
          color: window.MopanFamilyWheelColors[i % window.MopanFamilyWheelColors.length],
        };
      });
    }

    function renderTags(container, items, onRemove) {
      if (!container) return;
      container.innerHTML = '';
      items.forEach(function (item, idx) {
        var tag = document.createElement('span');
        tag.className = 'mp-family-tag';
        tag.textContent = item;
        var rm = document.createElement('button');
        rm.type = 'button';
        rm.className = 'mp-family-tag-rm';
        rm.setAttribute('aria-label', 'remove');
        rm.textContent = '×';
        rm.addEventListener('click', function () { onRemove(idx); });
        tag.appendChild(rm);
        container.appendChild(tag);
      });
    }

    function refresh() {
      renderTags(membersEl, members, function (idx) {
        if (members.length <= 2) {
          G.showToast(t('chore_min_people', '至少保留 2 人'));
          return;
        }
        members.splice(idx, 1);
        saveList(LS_MEMBERS, members);
        refresh();
      });
      renderTags(choresEl, chores, function (idx) {
        if (chores.length <= 2) {
          G.showToast(t('chore_min_tasks', '至少保留 2 项家务'));
          return;
        }
        chores.splice(idx, 1);
        saveList(LS_CHORES, chores);
        refresh();
      });
      choreWheel.setSegments(toSegments(chores));
      whoWheel.setSegments(toSegments(members));
    }

    function addItem(list, input, key, minMsg) {
      var val = (input && input.value || '').trim();
      if (!val) return;
      if (list.indexOf(val) >= 0) {
        G.showToast(t('chore_dup', '已经有了'));
        return;
      }
      if (list.length >= 10) {
        G.showToast(t('chore_max', '最多 10 项'));
        return;
      }
      list.push(val);
      saveList(key, list);
      if (input) input.value = '';
      refresh();
    }

    if (memberAdd) memberAdd.addEventListener('click', function () {
      addItem(members, memberInput, LS_MEMBERS);
    });
    if (choreAdd) choreAdd.addEventListener('click', function () {
      addItem(chores, choreInput, LS_CHORES);
    });
    if (memberInput) memberInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') addItem(members, memberInput, LS_MEMBERS);
    });
    if (choreInput) choreInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') addItem(chores, choreInput, LS_CHORES);
    });

    if (spinBtn) spinBtn.addEventListener('click', function () {
      if (choreWheel.spinning || whoWheel.spinning) return;
      if (resultEl) resultEl.hidden = true;
      spinBtn.disabled = true;
      choreWheel.spin().then(function (choreSeg) {
        return whoWheel.spin().then(function (whoSeg) {
          if (!choreSeg || !whoSeg) return;
          if (resultChore) resultChore.textContent = choreSeg.label;
          if (resultWho) resultWho.textContent = whoSeg.label;
          if (resultEl) {
            resultEl.hidden = false;
            resultEl.classList.remove('is-reveal');
            requestAnimationFrame(function () { resultEl.classList.add('is-reveal'); });
          }
          G.showToast(fmt(t('chore_done', '{who} 负责 {chore}'), {
            who: whoSeg.label,
            chore: choreSeg.label,
          }));
          spinBtn.disabled = false;
        });
      });
    });

    refresh();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
