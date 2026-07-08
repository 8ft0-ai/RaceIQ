(function mapRaceReplayConfidenceLabels() {
  const labels = {
    observed_since_capture: 'Observed from captured data only',
    high: 'High confidence',
    medium: 'Medium confidence',
    low: 'Low confidence'
  };

  function labelFor(value) {
    const raw = String(value || '').trim();
    if (!raw) return '—';
    return labels[raw] || raw.replaceAll('_', ' ');
  }

  function enhance() {
    const replay = document.getElementById('replay');
    if (!replay) return;

    replay.querySelectorAll('p.small').forEach(paragraph => {
      const text = paragraph.textContent || '';
      const prefix = 'Race story confidence: ';
      const index = text.indexOf(prefix);
      if (index < 0) return;

      const before = text.slice(0, index + prefix.length);
      const raw = text.slice(index + prefix.length).trim();
      const readable = labelFor(raw);
      const suffix = raw === 'observed_since_capture'
        ? ' — baseline is the first captured snapshot, not the race start'
        : '';
      paragraph.textContent = `${before}${readable}${suffix}`;
    });
  }

  function start() {
    const replay = document.getElementById('replay');
    if (!replay) return;

    const observer = new MutationObserver(() => enhance());
    observer.observe(replay, { childList: true, subtree: true, characterData: true });
    replay.addEventListener('input', event => {
      if (event.target && event.target.id === 'replaySlider') {
        window.requestAnimationFrame(enhance);
      }
    });

    enhance();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
