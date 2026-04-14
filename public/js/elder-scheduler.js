(function () {
  'use strict';

  // ---- Configuration ----
  const YEAR = 2026;
  const START_DATE = new Date(YEAR, 5, 1);  // June 1
  const END_DATE = new Date(YEAR, 11, 31);  // December 31
  const STORAGE_KEY = 'sbf-elder-scheduler';

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // ---- State ----
  let state = loadState();

  function defaultState() {
    return {
      elders: [],
      // assignments: { "2026-06-06": ["Elder Name", ...], ... }
      assignments: {}
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          elders: parsed.elders || [],
          assignments: parsed.assignments || {}
        };
      }
    } catch (e) {
      console.warn('Failed to load state from localStorage', e);
    }
    return defaultState();
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  // ---- Sabbath Date Generation ----
  function getSabbaths() {
    const sabbaths = [];
    const d = new Date(START_DATE);
    // Advance to first Saturday (day 6)
    while (d.getDay() !== 6) d.setDate(d.getDate() + 1);
    while (d <= END_DATE) {
      sabbaths.push(new Date(d));
      d.setDate(d.getDate() + 7);
    }
    return sabbaths;
  }

  function formatDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  function formatDateDisplay(date) {
    return MONTH_NAMES[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();
  }

  // Group sabbaths by month
  function groupByMonth(sabbaths) {
    const groups = {};
    sabbaths.forEach(function (d) {
      const key = d.getMonth();
      if (!groups[key]) groups[key] = [];
      groups[key].push(d);
    });
    return groups;
  }

  // ---- Rendering ----
  function getSelectedElder() {
    var sel = document.getElementById('elderSelect');
    return sel ? sel.value : '';
  }

  function renderElderDropdown() {
    var sel = document.getElementById('elderSelect');
    var current = sel.value;
    sel.innerHTML = '<option value="">-- Choose an Elder --</option>';
    state.elders.forEach(function (name) {
      var opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      if (name === current) opt.selected = true;
      sel.appendChild(opt);
    });
    updateRemoveButton();
  }

  function updateRemoveButton() {
    var btn = document.getElementById('removeElderBtn');
    btn.disabled = !getSelectedElder();
  }

  function renderCalendar() {
    var grid = document.getElementById('calendarGrid');
    var sabbaths = getSabbaths();
    var months = groupByMonth(sabbaths);
    var selectedElder = getSelectedElder();
    var html = '';

    var monthKeys = Object.keys(months).map(Number).sort(function (a, b) { return a - b; });

    monthKeys.forEach(function (monthIdx) {
      var dates = months[monthIdx];
      html += '<div class="month-block">';
      html += '<div class="month-title">' + MONTH_NAMES[monthIdx] + ' ' + YEAR + '</div>';
      html += '<div class="sabbath-list">';

      dates.forEach(function (date) {
        var key = formatDateKey(date);
        var assigned = state.assignments[key] || [];
        var isSelectedByElder = selectedElder && assigned.indexOf(selectedElder) !== -1;
        var noElder = !selectedElder;

        var cardClass = 'sabbath-card';
        if (isSelectedByElder) cardClass += ' selected';
        if (noElder) cardClass += ' no-elder';

        html += '<div class="' + cardClass + '" data-date="' + key + '">';
        html += '  <div>';
        html += '    <div class="sabbath-date">' + formatDateDisplay(date) + '</div>';
        html += '    <div class="sabbath-day">Sabbath</div>';
        if (assigned.length > 0) {
          html += '    <div class="sabbath-elders">' + assigned.join(', ') + '</div>';
        }
        html += '  </div>';

        if (isSelectedByElder) {
          html += '  <span class="sabbath-status signed-up">Signed Up</span>';
        } else if (assigned.length > 0) {
          html += '  <span class="sabbath-status signed-up">' + assigned.length + ' elder' + (assigned.length > 1 ? 's' : '') + '</span>';
        } else {
          html += '  <span class="sabbath-status available">Open</span>';
        }

        html += '</div>';
      });

      html += '</div></div>';
    });

    grid.innerHTML = html;
  }

  function renderSummary() {
    renderSummaryByDate();
    renderSummaryByElder();
  }

  function renderSummaryByDate() {
    var container = document.getElementById('summaryByDate');
    var sabbaths = getSabbaths();
    var html = '';

    sabbaths.forEach(function (date) {
      var key = formatDateKey(date);
      var assigned = state.assignments[key] || [];

      html += '<div class="summary-row">';
      html += '  <div class="summary-date">' + formatDateDisplay(date) + '</div>';
      html += '  <div class="elder-chips">';

      if (assigned.length > 0) {
        assigned.forEach(function (name) {
          html += '<span class="elder-chip">' + escapeHtml(name) + '</span>';
        });
      } else {
        html += '<span class="elder-chip none">No elder assigned</span>';
      }

      html += '  </div>';
      html += '</div>';
    });

    container.innerHTML = html;
  }

  function renderSummaryByElder() {
    var container = document.getElementById('summaryByElder');

    if (state.elders.length === 0) {
      container.innerHTML = '<p class="muted" style="padding:12px 0;">No elders added yet.</p>';
      return;
    }

    // Build map: elder -> list of date keys
    var elderDates = {};
    state.elders.forEach(function (name) {
      elderDates[name] = [];
    });

    Object.keys(state.assignments).forEach(function (dateKey) {
      var assigned = state.assignments[dateKey];
      assigned.forEach(function (name) {
        if (elderDates[name]) {
          elderDates[name].push(dateKey);
        }
      });
    });

    var html = '';
    state.elders.forEach(function (name) {
      var dates = elderDates[name] || [];
      dates.sort();

      html += '<div class="summary-row">';
      html += '  <div class="summary-elder-name">' + escapeHtml(name);
      html += '    <span class="count-badge">' + dates.length + ' Sabbath' + (dates.length !== 1 ? 's' : '') + '</span>';
      html += '  </div>';
      html += '  <div class="date-chips">';

      if (dates.length > 0) {
        dates.forEach(function (dk) {
          var d = new Date(dk + 'T12:00:00');
          var short = MONTH_NAMES[d.getMonth()].substring(0, 3) + ' ' + d.getDate();
          html += '<span class="date-chip">' + short + '</span>';
        });
      } else {
        html += '<span class="elder-chip none">No dates selected</span>';
      }

      html += '  </div>';
      html += '</div>';
    });

    container.innerHTML = html;
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ---- Event Handlers ----
  function handleSabbathClick(e) {
    var card = e.target.closest('.sabbath-card');
    if (!card) return;

    var elder = getSelectedElder();
    if (!elder) {
      alert('Please select your name from the dropdown first.');
      return;
    }

    var dateKey = card.getAttribute('data-date');
    if (!state.assignments[dateKey]) {
      state.assignments[dateKey] = [];
    }

    var idx = state.assignments[dateKey].indexOf(elder);
    if (idx !== -1) {
      // Remove assignment (toggle off)
      state.assignments[dateKey].splice(idx, 1);
      if (state.assignments[dateKey].length === 0) {
        delete state.assignments[dateKey];
      }
    } else {
      // Add assignment
      state.assignments[dateKey].push(elder);
    }

    saveState();
    renderCalendar();
    renderSummary();
  }

  function handleAddElder() {
    var input = document.getElementById('newElderName');
    var name = input.value.trim();
    if (!name) {
      alert('Please enter the elder\'s name.');
      return;
    }
    if (state.elders.indexOf(name) !== -1) {
      alert('This elder has already been added.');
      return;
    }
    state.elders.push(name);
    state.elders.sort();
    saveState();
    renderElderDropdown();
    // Auto-select the newly added elder
    document.getElementById('elderSelect').value = name;
    updateRemoveButton();
    renderCalendar();
    input.value = '';
  }

  function handleRemoveElder() {
    var elder = getSelectedElder();
    if (!elder) return;

    if (!confirm('Remove "' + elder + '" and all their assignments?')) return;

    // Remove from elders list
    var idx = state.elders.indexOf(elder);
    if (idx !== -1) state.elders.splice(idx, 1);

    // Remove all assignments for this elder
    Object.keys(state.assignments).forEach(function (dateKey) {
      var assignedIdx = state.assignments[dateKey].indexOf(elder);
      if (assignedIdx !== -1) {
        state.assignments[dateKey].splice(assignedIdx, 1);
        if (state.assignments[dateKey].length === 0) {
          delete state.assignments[dateKey];
        }
      }
    });

    saveState();
    renderElderDropdown();
    renderCalendar();
    renderSummary();
  }

  function handleClearAll() {
    if (!confirm('Are you sure you want to clear ALL data? This cannot be undone.')) return;
    state = defaultState();
    saveState();
    renderElderDropdown();
    renderCalendar();
    renderSummary();
  }

  function handlePrint() {
    window.print();
  }

  // ---- Navigation ----
  function handleNavigation() {
    var hash = location.hash.replace('#', '') || 'calendar';

    document.querySelectorAll('.nav-link').forEach(function (link) {
      var target = (link.getAttribute('href') || '').replace('#', '');
      link.classList.toggle('active', target === hash);
    });

    var calendarSection = document.getElementById('calendar');
    var summarySection = document.getElementById('summary');

    if (hash === 'summary') {
      calendarSection.style.display = 'none';
      summarySection.style.display = 'block';
      renderSummary();
    } else {
      calendarSection.style.display = 'block';
      summarySection.style.display = 'none';
    }
  }

  // ---- Initialize ----
  function init() {
    renderElderDropdown();
    renderCalendar();

    // Calendar click
    document.getElementById('calendarGrid').addEventListener('click', handleSabbathClick);

    // Add elder
    document.getElementById('addElderBtn').addEventListener('click', handleAddElder);
    document.getElementById('newElderName').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddElder();
      }
    });

    // Remove elder
    document.getElementById('removeElderBtn').addEventListener('click', handleRemoveElder);

    // Elder select change
    document.getElementById('elderSelect').addEventListener('change', function () {
      updateRemoveButton();
      renderCalendar();
    });

    // Summary actions
    document.getElementById('printBtn').addEventListener('click', handlePrint);
    document.getElementById('clearAllBtn').addEventListener('click', handleClearAll);

    // Navigation
    window.addEventListener('hashchange', handleNavigation);
    handleNavigation();
  }

  window.addEventListener('DOMContentLoaded', init);
})();
