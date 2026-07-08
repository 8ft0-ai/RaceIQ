(function loadDashboardEnhancements() {
  const ENHANCEMENT_GROUPS = [
    {
      area: 'Pit / delay map',
      reason: 'Filter/sort controls and row-specific triage evidence.',
      scripts: ['pit-delay-controls.js', 'pit-delay-review.js']
    },
    {
      area: 'Anomalies',
      reason: 'Category-first triage and row-specific action guidance.',
      scripts: ['anomaly-triage.js', 'anomaly-review.js']
    },
    {
      area: 'Shared review context',
      reason: 'Confidence and caveat panels for review-heavy tabs.',
      scripts: ['review-context-panels.js']
    },
    {
      area: 'Overview / Method',
      reason: 'Overview anomaly context and Method tab discoverability.',
      scripts: ['overview-anomaly-context.js', 'method-discoverability.js']
    },
    {
      area: 'Race replay',
      reason: 'User-facing confidence labels and trace highlighting.',
      scripts: ['race-replay-confidence-labels.js', 'race-replay-trace-highlight.js']
    },
    {
      area: 'Team Profiles / Report Cards',
      reason: 'Metric parity guidance and displayed pace-tie markers.',
      scripts: ['team-metric-parity.js', 'pace-profile-ties.js']
    },
    {
      area: 'Report Cards renderer',
      reason: 'Report Cards rendering remains separate from app.js but is loaded through the same explicit dashboard plan.',
      scripts: ['report-cards.js']
    }
  ];

  window.__raceIqEnhancementGroups = ENHANCEMENT_GROUPS.map(group => ({
    area: group.area,
    reason: group.reason,
    scripts: [...group.scripts]
  }));

  function loadScript(src, area) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.dataset.dashboardEnhancement = 'true';
      script.dataset.enhancementArea = area;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load dashboard enhancement script: ${src}`));
      document.body.appendChild(script);
    });
  }

  async function start() {
    for (const group of ENHANCEMENT_GROUPS) {
      for (const script of group.scripts) {
        await loadScript(script, group.area);
      }
    }
  }

  start().catch(error => {
    console.error(error);
  });
})();
