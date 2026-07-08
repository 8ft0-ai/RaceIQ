(function addPitDelaySortControls() {
  let currentSort = 'default';
  let rendering = false;

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"]/g, c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;'
    }[c]));
  }

  function fmt(value, digits = 1) {
    const n = Number(value);
    if (!Number.isFinite(n)) return '—';
    return n.toLocaleString('en-AU', { maximumFractionDigits: digits });
  }

  function badge(text, cls = '') {
    return `<span class="badge ${cls}">${escapeHtml(text)}</span>`;
  }

  function rows() {
    try {
      if (typeof state === 'undefined' || !Array.isArray(state.pitEvents)) return [];
      const filter = document.getElementById('delayFilter')?.value || 'all';
      const filtered = filter === 'all' ? state.pitEvents : state.pitEvents.filter(event => event.event_type === filter);
      const sorted = [...filtered];

      if (currentSort === 'duration_desc') {
        sorted.sort((a, b) => (Number(b.duration_seconds) || 0) - (Number(a.duration_seconds) || 0));
      } else if (currentSort === 'duration_asc') {
        sorted.sort((a, b) => (Number(a.duration_seconds) || 0) - (Number(b.duration_seconds) || 0));
      } else if (currentSort === 'laps_lost_desc') {
        sorted.sort((a, b) => (Number(b.estimated_laps_lost) || 0) - (Number(a.estimated_laps_lost) || 0));
      } else if (currentSort === 'laps_lost_asc') {
        sorted.sort((a, b) => (Number(a.estimated_laps_lost) || 0) - (Number(b.estimated_laps_lost) || 0));
      }

      return sorted.slice(0, 160);
    } catch (_err) {
      return [];
    }
  }

  function renderTable() {
    const target = document.getElementById('delayTable');
    if (!target) return;

    const tableRows = rows();
    window.__raceIqPitDelayRows = tableRows;
    if (!tableRows.length) {
      target.innerHTML = '<div class="notice"><p>No Pit/delay rows match this filter.</p></div>';
      return;
    }

    target.innerHTML = `<div class="table-wrap"><table><thead><tr>
      <th>Clock</th><th>Team</th><th>Type</th><th>Severity</th><th>Duration</th><th>Laps lost</th><th>Reason</th>
    </tr></thead><tbody>${tableRows.map(row => `<tr>
      <td>${escapeHtml(row.start_race_clock_display || '—')}</td>
      <td>${escapeHtml(row.team_name || '—')}</td>
      <td>${escapeHtml(row.event_type || '—')}</td>
      <td>${badge(row.severity || '—', row.severity === 'critical' ? 'bad' : row.severity === 'high' ? 'warn' : '')}</td>
      <td>${escapeHtml(row.duration_display || '—')}</td>
      <td>${escapeHtml(fmt(row.estimated_laps_lost, 1))}</td>
      <td>${escapeHtml(row.classification_reason || 'Review row evidence before use.')}</td>
    </tr>`).join('')}</tbody></table></div>`;

    target.dispatchEvent(new CustomEvent('raceiq:pit-delay-rows-changed'));
  }

  function ensureControls() {
    const filter = document.getElementById('delayFilter');
    if (!filter || document.getElementById('delaySort')) return;

    const label = document.createElement('label');
    label.className = 'badge';
    label.textContent = 'Sort';
    label.setAttribute('for', 'delaySort');

    const sort = document.createElement('select');
    sort.id = 'delaySort';
    sort.innerHTML = `
      <option value="default">Default order</option>
      <option value="duration_desc">Duration: longest first</option>
      <option value="duration_asc">Duration: shortest first</option>
      <option value="laps_lost_desc">Laps lost: highest first</option>
      <option value="laps_lost_asc">Laps lost: lowest first</option>`;
    sort.value = currentSort;

    filter.insertAdjacentElement('afterend', sort);
    filter.insertAdjacentElement('afterend', label);

    filter.addEventListener('change', () => window.requestAnimationFrame(renderTable));
    sort.addEventListener('change', () => {
      currentSort = sort.value;
      renderTable();
    });
  }

  function refresh() {
    if (rendering) return;
    rendering = true;
    ensureControls();
    renderTable();
    rendering = false;
  }

  function start() {
    const delays = document.getElementById('delays');
    if (!delays) return;

    const observer = new MutationObserver(() => {
      if (!document.getElementById('delaySort') && document.getElementById('delayFilter')) refresh();
    });
    observer.observe(delays, { childList: true, subtree: true });
    refresh();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
