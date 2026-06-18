(function () {
  'use strict';

  var DEFAULT_MEMBERS = ['爸爸', '妈妈', '哥哥', '妹妹'];
  var LS_MEMBERS = 'mopan-family-members';
  var LS_TASK = 'mopan-family-task';

  function boot() {
    if (!window.MopanGames || !window.MopanFamilyWheel) return;

    var G = window.MopanGames;
    var membersEl = document.getElementById('who-members');
    var memberInput = document.getElementById('who-member-input');
    var memberAdd = document.getElementById('who-member-add');
    var taskInput = document.getElementById('who-task-input');
    var resultEl = document.getElementById('who-result');
    var resultName = document.getElementById('who-result-name');
    var resultTask = document.getElementById('who-result-task');

    var members = loadList(LS_MEMBERS, DEFAULT_MEMBERS);
    var wheel = new window.MopanFamilyWheel({
      discId: 'who-only-disc',
      rotorId: 'who-only-rotor',
      spinBtnId: 'who-only-spin',
      segments: toSegments(members),
      onResult: function (seg) {
        var task = (taskInput && taskInput.value || '').trim() || G.readI18n('games_who_default_task', '做家务');
        if (taskInput) {
          localStorage.setItem(LS_TASK, task);
        }
        if (resultName) resultName.textContent = seg.label;
        if (resultTask) resultTask.textContent = task;
        if (resultEl) {
          resultEl.hidden = false;
          resultEl.classList.remove('is-reveal');
          requestAnimationFrame(function () { resultEl.classList.add('is-reveal'); });
        }
        G.showToast(seg.label + ' · ' + task);
      },
    });

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

    function toSegments(labels) {
      return labels.map(function (label, i) {
        return {
          label: label,
          color: window.MopanFamilyWheelColors[i % window.MopanFamilyWheelColors.length],
        };
      });
    }

    function renderTags(items) {
      if (!membersEl) return;
      membersEl.innerHTML = '';
      items.forEach(function (item, idx) {
        var tag = document.createElement('span');
        tag.className = 'mp-family-tag';
        tag.textContent = item;
        var rm = document.createElement('button');
        rm.type = 'button';
        rm.className = 'mp-family-tag-rm';
        rm.textContent = '×';
        rm.addEventListener('click', function () {
          if (members.length <= 2) {
            G.showToast(G.readI18n('games_chore_min_people', '至少保留 2 人'));
            return;
          }
          members.splice(idx, 1);
          localStorage.setItem(LS_MEMBERS, JSON.stringify(members));
          renderTags(members);
          wheel.setSegments(toSegments(members));
        });
        tag.appendChild(rm);
        membersEl.appendChild(tag);
      });
    }

    if (taskInput) {
      var saved = localStorage.getItem(LS_TASK);
      if (saved) taskInput.value = saved;
      taskInput.addEventListener('change', function () {
        localStorage.setItem(LS_TASK, taskInput.value.trim());
      });
    }

    if (memberAdd) memberAdd.addEventListener('click', function () {
      var val = (memberInput && memberInput.value || '').trim();
      if (!val || members.indexOf(val) >= 0) return;
      if (members.length >= 10) return;
      members.push(val);
      localStorage.setItem(LS_MEMBERS, JSON.stringify(members));
      if (memberInput) memberInput.value = '';
      renderTags(members);
      wheel.setSegments(toSegments(members));
    });

    renderTags(members);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
