(function enhancePitDelayReasons() {
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

  function formatSeconds(seconds) {
    const n = numberOrNull(seconds);
    if (n === null) return missing;
    const total = Math.max(0, Math.round(n));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function displayDuration(event, field, fallbackSeconds) {
    return event[field] || formatSeconds(event[fallbackSeconds]);
  }

  function eventTypeLabel(event) {
    const type = event.event_type || '';
    if (event.known_incident_id) return 'Known incident context';
    if (type.includes('major')) return 'Major stoppage candidate';
    if (type.includes('short')) return 'Short-delay candidate';
    if (type.includes('pit') || type.includes('repair')) return 'Pit / repair candidate';
    return 'Delay review candidate';
  }

  function reviewPriority(event) {
    const lapsLost = numberOrNull(event.estimated_laps_lost) || 0;
    const excessSeconds = numberOrNull(event.excess_delay_seconds) || 0;
    const severity = event.severity || '';

    if (event.known_incident_id) return 'Check against known incident';
    if (severity === 'critical' || lapsLost >= 20 || excessSeconds >= 900) return 'Review first';
    if (severity === 'high' || lapsLost >= 8 || excessSeconds >= 300) return 'High review value';
    if (event.event_type === 'short_delay') return 'Lower priority check';
    return 'Standard review';
  }

  function buildReason(event) {
    const duration = displayDuration(event, 'duration_display', 'duration_seconds');
    const excess = displayDuration(event, 'excess_delay_display', 'excess_delay_seconds');
    const lapsLost = formatNumber(event.estimated_laps_lost, 1);
    const positionLoss = numberOrNull(event.position_loss);
    const leaderGain = numberOrNull(event.leader_laps_gained);
    const confidence = event.confidence ? String(event.confidence).replaceAll('_', ' ') : missing;

    const type = event.event_type || '';
    const evidence = [
      `duration ${duration}`,
      `excess ${excess}`,
      `est. ${lapsLost} laps lost`,
      positionLoss && positionLoss > 0 ? `lost ${formatNumber(positionLoss, 0)} positions` : 'no position loss recorded',
      leaderGain && leaderGain > 0 ? `leader gained ${formatNumber(leaderGain, 0)} laps` : null,
      `confidence ${confidence}`
    ].filter(Boolean).join(' · ');

    let explanation;
    if (event.known_incident_id) {
      explanation = 'This delay overlaps known incident context and should be read with the incident caveat before drawing performance conclusions.';
    } else if (type.includes('major')) {
      explanation = 'Progress resumed after a long excess delay, making this a likely major repair, long pit, recovery or prolonged stop candidate.';
    } else if (type.includes('short')) {
      explanation = 'The gap exceeded the adaptive delay threshold but remained short, so treat it as a lower-priority stop, marshal-delay or unusually slow-lap candidate.';
    } else if (type.includes('pit') || type.includes('repair')) {
      explanation = 'Progress resumed after a delay materially above expected pace, making this a pit, repair or recovery candidate.';
    } else {
      explanation = 'This row exceeded the delay-review threshold and should be reviewed using the visible timing evidence.';
    }

    return { evidence, explanation };
  }

  function currentRows() {
    try {
      if (typeof state === 'undefined' || !Array.isArray(state.pitEvents)) return [];
      const filter = document.getElementById('delayFilter')?.value || 'all';
      const rows = filter === 'all' ? state.pitEvents : state.pitEvents.filter(event => event.event_type === filter);
      return rows.slice(0, 160);
    } catch (_err) {
      return [];
    }
  }

  function enhanceTable() {
    const table = document.querySelector('#delayTable table');
    if (!table) return;

    const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());
    const reasonIndex = headers.indexOf('Reason');
    if (reasonIndex < 0) return;

    const rows = currentRows();
    table.querySelectorAll('tbody tr').forEach((tr, index) => {
      const event = rows[index];
      const cell = tr.children[reasonIndex];
      if (!event || !cell) return;

      const { evidence, explanation } = buildReason(event);
      cell.innerHTML = `
        <div class="story-title">${escapeHtml(reviewPriority(event))} · ${escapeHtml(eventTypeLabel(event))}</div>
        <p>${escapeHtml(explanation)}</p>
        <div class="story-meta">${escapeHtml(evidence)}</div>
      `;
    });
  }

  function start() {
    const delays = document.getElementById('delays');
    if (!delays) return;

    const observer = new MutationObserver(() => enhanceTable());
    observer.observe(delays, { childList: true, subtree: true });

    document.addEventListener('change', event => {
      if (event.target && event.target.id === 'delayFilter') {
        window.requestAnimationFrame(enhanceTable);
      }
    });

    enhanceTable();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
