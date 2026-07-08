(function markPaceProfileTies() {
  function fmt(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    return n.toLocaleString('en-AU', { maximumFractionDigits: 1, minimumFractionDigits: 1 });
  }

  function profiles() {
    try {
      return (typeof state !== 'undefined' && Array.isArray(state.teamProfiles)) ? state.teamProfiles : [];
    } catch (_err) {
      return [];
    }
  }

  function duplicateDisplayedPaces() {
    const counts = new Map();
    profiles().forEach(profile => {
      const key = fmt(profile.median_clean_lph);
      if (!key) return;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return new Set(Array.from(counts.entries()).filter(([, count]) => count > 1).map(([key]) => key));
  }

  function findPaceCards() {
    return Array.from(document.querySelectorAll('.card')).filter(card => {
      const heading = card.querySelector('h3')?.textContent?.trim() || '';
      return heading === 'Top pace profiles' || heading.includes('pace profile');
    });
  }

  function markTies() {
    const ties = duplicateDisplayedPaces();
    if (!ties.size) return;

    findPaceCards().forEach(card => {
      if (!card.querySelector('[data-pace-tie-note="true"]')) {
        const note = document.createElement('p');
        note.className = 'small';
        note.dataset.paceTieNote = 'true';
        note.textContent = 'Displayed one-decimal pace ties are marked as tied. Order remains the existing analytical display order, not an official tiebreaker.';
        card.appendChild(note);
      }

      card.querySelectorAll('.bar-row').forEach(row => {
        const value = row.querySelector('.bar-value');
        if (!value || value.querySelector('[data-pace-tie-badge="true"]')) return;
        const text = value.textContent || '';
        const matched = Array.from(ties).find(tie => text.includes(tie));
        if (!matched) return;

        const badge = document.createElement('span');
        badge.className = 'badge';
        badge.dataset.paceTieBadge = 'true';
        badge.textContent = 'tied';
        badge.title = `${matched} lph is tied at displayed precision`;
        value.appendChild(document.createTextNode(' '));
        value.appendChild(badge);
      });
    });
  }

  function start() {
    const targets = ['overview', 'teams'].map(id => document.getElementById(id)).filter(Boolean);
    targets.forEach(target => {
      const observer = new MutationObserver(() => markTies());
      observer.observe(target, { childList: true, subtree: true });
    });
    markTies();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
