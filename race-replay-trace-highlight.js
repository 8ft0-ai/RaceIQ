(function addRaceReplayTraceHighlight() {
  let activeIndex = null;

  function reset(paths, chips) {
    activeIndex = null;
    paths.forEach(path => {
      path.style.opacity = '.88';
      path.style.strokeWidth = '2.1';
    });
    chips.forEach(chip => {
      chip.setAttribute('aria-pressed', 'false');
      chip.classList.remove('selected');
      chip.style.opacity = '1';
    });
  }

  function apply(paths, chips, index) {
    activeIndex = index;
    paths.forEach((path, i) => {
      path.style.opacity = i === index ? '1' : '.15';
      path.style.strokeWidth = i === index ? '4' : '1.4';
    });
    chips.forEach((chip, i) => {
      chip.setAttribute('aria-pressed', String(i === index));
      chip.classList.toggle('selected', i === index);
      chip.style.opacity = i === index ? '1' : '.45';
    });
  }

  function enhanceChart() {
    const replay = document.getElementById('replay');
    if (!replay) return;

    const chartCards = Array.from(replay.querySelectorAll('.card'));
    const traceCard = chartCards.find(card => card.textContent.includes('Top-12 position traces'));
    if (!traceCard || traceCard.dataset.traceHighlightReady === 'true') return;

    const paths = Array.from(traceCard.querySelectorAll('svg polyline'));
    const chips = Array.from(traceCard.querySelectorAll('.controls .badge'));
    if (!paths.length || !chips.length) return;

    traceCard.dataset.traceHighlightReady = 'true';

    chips.forEach((chip, index) => {
      chip.setAttribute('role', 'button');
      chip.setAttribute('tabindex', '0');
      chip.setAttribute('aria-pressed', 'false');
      chip.setAttribute('title', `${chip.textContent.trim()} — click to highlight this trace`);
      chip.style.cursor = 'pointer';

      const toggle = () => {
        if (activeIndex === index) {
          reset(paths, chips);
        } else {
          apply(paths, chips, index);
        }
      };

      chip.addEventListener('click', toggle);
      chip.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          toggle();
        }
        if (event.key === 'Escape') {
          reset(paths, chips);
        }
      });
    });
  }

  function start() {
    const replay = document.getElementById('replay');
    if (!replay) return;

    const observer = new MutationObserver(() => enhanceChart());
    observer.observe(replay, { childList: true, subtree: true });
    enhanceChart();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
