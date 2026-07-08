(function enhanceOverviewAnomalyKpi() {
  const broadTimingTypes = new Set(['suspicious_last_lap', 'extreme_long_lap']);

  function fmt(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return '—';
    return n.toLocaleString('en-AU', { maximumFractionDigits: 0 });
  }

  function anomalyCounts() {
    try {
      if (typeof state === 'undefined' || !Array.isArray(state.anomalies)) {
        return { total: 0, reviewFirst: 0, broad: 0 };
      }
      const total = state.anomalies.length;
      const broad = state.anomalies.filter(row => broadTimingTypes.has(row.anomaly_type)).length;
      return { total, broad, reviewFirst: Math.max(total - broad, 0) };
    } catch (_err) {
      return { total: 0, reviewFirst: 0, broad: 0 };
    }
  }

  function enhance() {
    const overview = document.getElementById('overview');
    if (!overview) return;

    const cards = Array.from(overview.querySelectorAll('.kpi'));
    const card = cards.find(candidate => {
      const label = candidate.querySelector('.metric-label');
      return label && label.textContent.trim() === 'Open anomalies';
    }) || cards.find(candidate => {
      const label = candidate.querySelector('.metric-label');
      return label && label.textContent.trim() === 'Review-first anomalies';
    });

    if (!card) return;

    const { total, broad, reviewFirst } = anomalyCounts();
    const metric = card.querySelector('.metric');
    const label = card.querySelector('.metric-label');
    if (metric) metric.textContent = fmt(reviewFirst);
    if (label) label.textContent = 'Review-first anomalies';

    let note = card.querySelector('[data-overview-anomaly-note="true"]');
    if (!note) {
      note = document.createElement('p');
      note.className = 'small';
      note.dataset.overviewAnomalyNote = 'true';
      card.appendChild(note);
    }
    note.textContent = `${fmt(total)} total open · ${fmt(broad)} broad timing signals. Review signals, not official findings.`;
  }

  function start() {
    const overview = document.getElementById('overview');
    if (!overview) return;

    const observer = new MutationObserver(() => enhance());
    observer.observe(overview, { childList: true, subtree: true });
    enhance();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
