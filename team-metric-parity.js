(function addTeamMetricParityGuidance() {
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

  function profiles() {
    try {
      return (typeof state !== 'undefined' && Array.isArray(state.teamProfiles)) ? state.teamProfiles : [];
    } catch (_err) {
      return [];
    }
  }

  function metricMap(kind) {
    const title = kind === 'teams' ? 'Metric map: Team Profiles' : 'Metric map: Report Cards';
    const emphasis = kind === 'teams'
      ? 'Team Profiles are for captured-segment comparison: pace, reliability, consistency, delay burden and position volatility.'
      : 'Report Cards are for story-level synthesis: RaceIQ score/grade, movement, delay burden, confidence reasons and caveats.';

    return `<div class="notice" data-team-metric-parity="${kind}">
      <strong>${escapeHtml(title)}.</strong> ${escapeHtml(emphasis)}
      <p class="small">Shared canonical metrics include finish result, captured pace, consistency/reliability, inferred delay burden and confidence context. Tab-specific scores are explanatory review aids, not official rankings.</p>
    </div>`;
  }

  function insertAfterHeader(sectionId, kind) {
    const section = document.getElementById(sectionId);
    if (!section || section.querySelector(`[data-team-metric-parity="${kind}"]`)) return;
    const header = section.querySelector('.section-header');
    if (!header) return;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = metricMap(kind).trim();
    header.insertAdjacentElement('afterend', wrapper.firstElementChild);
  }

  function addReportCardReliability() {
    const detail = document.querySelector('#teamReportDetail .report-card-detail');
    if (!detail || detail.querySelector('[data-report-card-reliability="true"]')) return;

    const teamName = detail.querySelector('h2')?.textContent?.trim();
    if (!teamName) return;
    const profile = profiles().find(item => item.team_name === teamName);
    if (!profile) return;

    const facts = detail.querySelector('.report-facts');
    if (!facts) return;

    const box = document.createElement('div');
    box.className = 'detail-box';
    box.dataset.reportCardReliability = 'true';
    box.innerHTML = `<strong>Reliability</strong><p>${escapeHtml(fmt(profile.race_reliability_score, 1))}/100 · Team Profiles metric, shown here for cross-tab reference</p>`;
    facts.insertBefore(box, facts.children[2] || null);
  }

  function refresh() {
    insertAfterHeader('teams', 'teams');
    insertAfterHeader('reportCards', 'reportCards');
    addReportCardReliability();
  }

  function start() {
    ['teams', 'reportCards'].forEach(id => {
      const section = document.getElementById(id);
      if (!section) return;
      const observer = new MutationObserver(() => refresh());
      observer.observe(section, { childList: true, subtree: true });
    });
    refresh();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
