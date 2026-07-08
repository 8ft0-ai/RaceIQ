(function enhanceAnomalyActions() {
  const missing = '—';

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"]/g, c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;'
    }[c]));
  }

  function numberOrNull(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  function formatNumber(value, digits = 1) {
    const n = numberOrNull(value);
    if (n === null) return missing;
    return n.toLocaleString('en-AU', { maximumFractionDigits: digits });
  }

  function labelFromEnum(value) {
    return String(value || missing).replaceAll('_', ' ');
  }

  function actionLabel(row) {
    const type = row.anomaly_type || '';
    const observations = numberOrNull(row.observation_count) || 0;
    const metric = numberOrNull(row.metric_value) || 0;

    if (row.known_incident_status && row.known_incident_status !== 'none') return 'Known incident context';
    if (type === 'implausible_lap_jump') return 'Review first · check lap jump';
    if (type === 'suspicious_fastest_lap') return 'Review first · check fastest lap';
    if (type === 'extreme_long_lap' && metric >= 30) return 'High review value · likely delay evidence';
    if (type === 'extreme_long_lap') return 'Likely delay evidence · keep as review signal';
    if (type === 'suspicious_last_lap' && observations > 10) return 'Lower priority · repeated timing signal';
    if (type === 'suspicious_last_lap') return 'Lower priority · timing check';
    return 'Review with row evidence';
  }

  function guidance(row) {
    const type = row.anomaly_type || '';
    const metric = formatNumber(row.metric_value, type === 'suspicious_fastest_lap' ? 2 : 1);
    const metricName = labelFromEnum(row.metric_name);
    const observations = formatNumber(row.observation_count, 0);

    if (row.known_incident_status && row.known_incident_status !== 'none') {
      return 'Read this against the known incident context before using it as performance evidence.';
    }

    if (type === 'implausible_lap_jump') {
      return 'Prioritise this row: the lap delta is implausible and should be excluded from inferred lap-rate analysis unless raw timing confirms it.';
    }

    if (type === 'suspicious_fastest_lap') {
      return 'Prioritise this row: fastest-lap values can distort pace stories, so check the raw LiveRC row or timing export before treating it as performance evidence.';
    }

    if (type === 'extreme_long_lap') {
      return 'Treat this as likely delay, stop, marshal, repair or timing-noise evidence rather than a clean pace sample.';
    }

    if (type === 'suspicious_last_lap') {
      return 'Treat this as a broad timing-quality signal unless other evidence makes it a higher-value review candidate.';
    }

    return `Review this ${labelFromEnum(type)} row using the visible ${metricName} evidence.`;
  }

  function evidence(row) {
    const fields = [
      `${labelFromEnum(row.anomaly_type)}`,
      `severity ${labelFromEnum(row.severity)}`,
      `${labelFromEnum(row.metric_name)} ${formatNumber(row.metric_value, row.anomaly_type === 'suspicious_fastest_lap' ? 2 : 1)}`,
      `observed ${formatNumber(row.observation_count, 0)}×`,
      row.lap !== undefined && row.lap !== null ? `lap ${formatNumber(row.lap, 0)}` : null,
      row.position !== undefined && row.position !== null ? `position ${formatNumber(row.position, 0)}` : null
    ].filter(Boolean);

    return fields.join(' · ');
  }

  function currentRows() {
    try {
      if (typeof state === 'undefined' || !Array.isArray(state.anomalies)) return [];
      return state.anomalies.slice(0, 220);
    } catch (_err) {
      return [];
    }
  }

  function enhanceTable() {
    const tables = Array.from(document.querySelectorAll('#anomalies table'));
    if (!tables.length) return;

    const table = tables.find(candidate => {
      const headers = Array.from(candidate.querySelectorAll('thead th')).map(th => th.textContent.trim());
      return headers.includes('Action') && headers.includes('Type');
    });
    if (!table) return;

    const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());
    const actionIndex = headers.indexOf('Action');
    if (actionIndex < 0) return;

    const rows = currentRows();
    table.querySelectorAll('tbody tr').forEach((tr, index) => {
      const row = rows[index];
      const cell = tr.children[actionIndex];
      if (!row || !cell) return;

      cell.innerHTML = `
        <div class="story-title">${escapeHtml(actionLabel(row))}</div>
        <p>${escapeHtml(guidance(row))}</p>
        <div class="story-meta">${escapeHtml(evidence(row))}</div>
      `;
    });
  }

  function start() {
    const anomalies = document.getElementById('anomalies');
    if (!anomalies) return;

    const observer = new MutationObserver(() => enhanceTable());
    observer.observe(anomalies, { childList: true, subtree: true });

    enhanceTable();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
