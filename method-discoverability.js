(function addMethodDiscoverabilityLink() {
  function switchToMethod() {
    const targetTab = document.querySelector('.tab[data-tab="method"]');
    const targetPanel = document.getElementById('method');
    if (!targetTab || !targetPanel) return;

    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
    targetTab.classList.add('active');
    targetPanel.classList.add('active');
    targetPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function enhance() {
    const overview = document.getElementById('overview');
    if (!overview || overview.querySelector('[data-method-discoverability="true"]')) return;

    const notice = overview.querySelector('.notice');
    if (!notice) return;

    const link = document.createElement('button');
    link.type = 'button';
    link.className = 'badge';
    link.dataset.methodDiscoverability = 'true';
    link.textContent = 'What does this mean? See Method';
    link.style.marginLeft = '0.5rem';
    link.addEventListener('click', switchToMethod);
    notice.appendChild(link);
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
