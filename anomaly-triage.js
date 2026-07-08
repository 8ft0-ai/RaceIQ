(function renderAnomalyTriageView() {
  const broadTimingTypes = new Set(['suspicious_last_lap', 'extreme_long_lap']);
  let currentFilter = 'priority';
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

  function labelFromEnum(value) {
    return String(value || '—').replaceAll('_', ' ');
  }

  function rows() {
    try {
      if (typeof state === 'undefined' || !Array.isArray(state.anomalies)) return [];
      return state.anomalies;
    } catch (_err) {
      return [];
    }
  }

  function knownIncidents() {
    try {
      if (typeof state === 'undefined' || !Array.isArray(state.incidents)) return [];
      return state.incidents;
    } catch (_err) {
      return [];
    }
  }

  function groupByType(allRows) {
    return Array.from(allRows.reduce((map, row) => {
      const type = row.anomaly_type || 'unknown';
      map.set(type, (map.get(type) || 0) + 1);
      return map;
    }, new Map()).entries())
      .map(([type, count]) => ({ type, count, broad: broadTimingTypes.has(type) }))
      .sort((a, b) => {
        if (a.broad !== b.broad) return a.broad ? 1 : -1;
        return b.count - a.count || a.type.localeCompare(b.type);
      });
  }

  function priorityRows(allRows) {
    return allRows.filter(row => !broadTimingTypes.has(row.anomaly_type));
  }

  function filteredRows(allRows, filter) {
    if (filter === 'all') return allRows;
    if (filter === 'priority') return priorityRows(allRows);
    return allRows.filter(row => row.anomaly_type === filter);
  }

  function badge(text, cls = '') {
    return `<span class="badge ${cls}">${escapeHtml(text)}</span>`;
  }

  function severityBadge(row) {
    const severity = row.severity || 'unknown';
    const cls = severity === 'critical' ? 'bad' : severity === 'high' ? 'warn' : '';
    return badge(severity, cls);
  }

  function table(tableRows, empty = 'No anomaly rows match this view') {
    if (!tableRows.length) return `<div class="notice"><p>${escapeHtml(empty)}</p></div>`;
    return `<div class="table-wrap"><table><thead><tr>
      <th>Severity</th><th>Type</th><th>Team</th><th>Clock</th><th>Metric</th><th>Details</th><th>Action</th>
    </tr></thead><tbody>${tableRows.map(row => `<tr>
      <td>${severityBadge(row)}</td>
      <td>${escapeHtml(row.anomaly_type || '—')}</td>
      <td>${escapeHtml(row.team_name || '—')}</td>
      <td>${escapeHtml(row.timestamp_utc || '—')}</td>
      <td>${escapeHtml(fmt(row.metric_value, row.anomaly_type === 'suspicious_fastest_lap' ? 2 : 1))} ${escapeHtml(row.metric_name || '')}</td>
      <td>${escapeHtml(row.details || '—')}</td>
      <td>${escapeHtml(row.recommended_action || 'Review row evidence before use.')}</td>
    </tr>`).join('')}</tbody></table></div>`;
  }

  function incidentTable(items) {
    if (!items.length) return `<div class="notice"><p>No known incidents recorded.</p></div>`;
    return `<div class="table-wrap"><table><thead><tr><th>Team</th><th>Type</th><th>Status</th><th>Resolution</th></tr></thead><tbody>${items.map(item => `<tr>
      <td>${escapeHtml(item.team_name || '—')}</td>
      <td>${escapeHtml(item.incident_type || '—')}</td>
      <td>${escapeHtml(item.incident_status || '—')}</td>
      <td>${escapeHtml(item.analytics_resolution || '—')}</td>
    </tr>`).join('')}</tbody></table></div>`;
  }

  function categoryNote(type) {
    if (type === 'implausible_lap_jump') return 'High-signal review: lap movement is not plausible without raw timing confirmation.';
    if (type === 'suspicious_fastest_lap') return 'High-signal review: fastest-lap values can distort pace stories.';
    if (type === 'extreme_long_lap') return 'Broad timing/delay signal: often pit, stop, recovery or timing-noise evidence.';
    if (type === 'suspicious_last_lap') return 'Broad timing-quality signal: useful context, usually lower review priority.';
    return 'Review signal: inspect row evidence before using this in analysis.';
  }

  function renderButtons(groups, filter) {
    const priorityCount = priorityRows(rows()).length;
    const entries = [
      { key: 'priority', label: `Review first (${fmt(priorityCount, 0)})` },
      { key: 'all', label: `All open items (${fmt(rows().length, 0)})` },
      ...groups.map(group => ({ key: group.type, label: `${labelFromEnum(group.type)} (${fmt(group.count, 0)})` }))
    ];

    return `<div class="controls">${entries.map(entry => `<button class="badge anomaly-filter" data-anomaly-filter="${escapeHtml(entry.key)}" aria-pressed="${entry.key === filter ? 'true' : 'false'}">${escapeHtml(entry.label)}</button>`).join('')}</div>`;
  }

  function render(filter = currentFilter) {
    const panel = document.getElementById('anomalies');
    const allRows = rows();
    if (!panel || !allRows.length) return;

    rendering = true;
    currentFilter = filter;

    const groups = groupByType(allRows);
    const selectedRows = filteredRows(allRows, filter);
    const priorityCount = priorityRows(allRows).length;
    const broadCount = allRows.length - priorityCount;
    const selectedLabel = filter === 'priority'
      ? 'Review-first anomaly items'
      : filter === 'all'
        ? 'All open anomaly items'
        : `${labelFromEnum(filter)} anomaly items`;

    window.__raceIqAnomalyRows = selectedRows.slice(0, 220);

    panel.innerHTML = `
      <div data-anomaly-triage="true">
        <div class="section-header"><div><h2>Anomaly review board</h2><p>Start with anomaly categories, then drill into rows. These are review signals, not official race findings.</p></div></div>
        <div class="grid cols-3">
          <div class="card"><h3>Review-first items</h3><div class="metric">${escapeHtml(fmt(priorityCount, 0))}</div><p>Rare or higher-signal anomaly types that should be checked before broad timing-noise categories.</p></div>
          <div class="card"><h3>Broad timing signals</h3><div class="metric">${escapeHtml(fmt(broadCount, 0))}</div><p>High-volume last-lap or long-lap signals. Useful context, but usually lower triage priority.</p></div>
          <div class="card"><h3>Total open items</h3><div class="metric">${escapeHtml(fmt(allRows.length, 0))}</div><p>All open anomaly records remain available through the all-items drill-down.</p></div>
        </div>
        <div class="section-header"><div><h2>Type breakdown</h2><p>Use the chips to drill into a category. Counts are computed from the loaded anomaly review board.</p></div></div>
        <div class="grid cols-2">${groups.map(group => `<div class="card"><h3>${escapeHtml(labelFromEnum(group.type))}</h3><div class="metric">${escapeHtml(fmt(group.count, 0))}</div><p>${escapeHtml(categoryNote(group.type))}</p><div class="controls">${badge(group.broad ? 'Broad timing signal' : 'Review first', group.broad ? '' : 'warn')}</div></div>`).join('')}</div>
        <div class="section-header"><div><h2>${escapeHtml(selectedLabel)}</h2><p>${escapeHtml(selectedRows.length)} rows in this view. Full anomaly records are retained; this view changes triage order only.</p></div>${renderButtons(groups, filter)}</div>
        <div id="anomalyDrilldown">${table(selectedRows.slice(0, 220))}</div>
        <div class="section-header"><div><h2>Known incidents</h2><p>Known incidents remain separate from open anomaly review items.</p></div></div>
        <div class="card">${incidentTable(knownIncidents())}</div>
      </div>`;

    panel.querySelectorAll('[data-anomaly-filter]').forEach(button => {
      button.addEventListener('click', () => render(button.dataset.anomalyFilter || 'priority'));
    });

    rendering = false;
    window.requestAnimationFrame(() => panel.dispatchEvent(new CustomEvent('raceiq:anomaly-rows-changed')));
  }

  function start() {
    const panel = document.getElementById('anomalies');
    if (!panel) return;

    const observer = new MutationObserver(() => {
      if (rendering) return;
      if (!panel.querySelector('[data-anomaly-triage="true"]') && rows().length) render(currentFilter);
    });
    observer.observe(panel, { childList: true, subtree: true });

    render(currentFilter);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
