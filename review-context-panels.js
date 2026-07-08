(function addReviewContextPanels() {
  function contextMarkup(kind) {
    if (kind === 'delays') {
      return `
        <div class="grid cols-2" data-review-context-panel="delays">
          <div class="card">
            <h3>How to read this tab</h3>
            <p>Pit / delay rows are inferred candidates from captured timing gaps. They can point to likely pit, repair, stop, marshal or recovery moments, but they are not official pit records.</p>
          </div>
          <div class="card">
            <h3>Confidence and caveats</h3>
            <p>Use duration, excess delay, laps lost, confidence and known incident context together. The first part of the race was not captured, and team pit sheets or race notes should override inferred explanations.</p>
          </div>
        </div>`;
    }

    return `
      <div class="grid cols-2" data-review-context-panel="anomalies">
        <div class="card">
          <h3>How to read this tab</h3>
          <p>Anomalies are review signals, not official findings. Start with review-first categories, then use the full table when you need traceability back to every open item.</p>
        </div>
        <div class="card">
          <h3>Confidence and caveats</h3>
          <p>High-volume timing categories usually need less attention than rare lap-jump or fastest-lap issues. Known incidents remain separate so timing artefacts do not become performance conclusions.</p>
        </div>
      </div>`;
  }

  function insertPanel(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section || section.querySelector(`[data-review-context-panel="${sectionId}"]`)) return;

    const firstHeader = section.querySelector('.section-header');
    const wrapper = document.createElement('div');
    wrapper.innerHTML = contextMarkup(sectionId).trim();
    const panel = wrapper.firstElementChild;
    if (!panel) return;

    if (firstHeader && firstHeader.parentNode) {
      firstHeader.insertAdjacentElement('afterend', panel);
    } else {
      section.prepend(panel);
    }
  }

  function refresh() {
    insertPanel('delays');
    insertPanel('anomalies');
  }

  function start() {
    const sections = ['delays', 'anomalies']
      .map(id => document.getElementById(id))
      .filter(Boolean);

    sections.forEach(section => {
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
