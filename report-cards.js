(() => {
  const DATA_FILES = {
    gridToFinish: 'data/grid_to_finish.json',
    gridValidation: 'data/grid_to_finish_validation.json'
  };

  const $ = (id) => document.getElementById(id);
  const fmt = (v, digits = 1) => (v === null || v === undefined || Number.isNaN(Number(v)))
    ? '—'
    : Number(v).toLocaleString('en-AU', { maximumFractionDigits: digits });
  const escapeHtml = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const signed = (v) => {
    if (v === null || v === undefined || Number.isNaN(Number(v))) return '—';
    const n = Number(v);
    return n > 0 ? `+${fmt(n, 0)}` : fmt(n, 0);
  };

  function kpi(label, value, note = '') {
    return `<div class="kpi"><div class="metric">${escapeHtml(value)}</div><div class="metric-label">${escapeHtml(label)}</div>${note ? `<p class="small">${escapeHtml(note)}</p>` : ''}</div>`;
  }

  function badge(text, cls = '') {
    return `<span class="badge ${cls}">${escapeHtml(text)}</span>`;
  }

  function movementClass(value) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return 'neutral';
    const n = Number(value);
    if (n > 0) return 'up';
    if (n < 0) return 'down';
    return 'neutral';
  }

  function movementBadge(value, label = '') {
    const cls = movementClass(value);
    const prefix = label ? `${label} ` : '';
    return `<span class="movement-value ${cls}">${escapeHtml(prefix + signed(value))}</span>`;
  }

  function table(rows, columns, empty = 'No data') {
    if (!rows || !rows.length) return `<div class="notice"><p>${empty}</p></div>`;
    return `<div class="table-wrap"><table><thead><tr>${columns.map(c => `<th>${escapeHtml(c.label)}</th>`).join('')}</tr></thead><tbody>` +
      rows.map(r => `<tr>${columns.map(c => `<td>${c.render ? c.render(r) : escapeHtml(r[c.key])}</td>`).join('')}</tr>`).join('') +
      `</tbody></table></div>`;
  }

  function movementBars(rows, valueKey) {
    const vals = rows.map(r => Math.abs(Number(r[valueKey]) || 0));
    const max = Math.max(...vals, 1);
    return `<div class="chart movement-chart">${rows.map(r => {
      const v = Number(r[valueKey]) || 0;
      const width = Math.round((Math.abs(v) / max) * 50);
      const cls = movementClass(v);
      const style = cls === 'up'
        ? `left:50%;width:${width}%`
        : cls === 'down'
          ? `left:${50 - width}%;width:${width}%`
          : 'left:50%;width:0%';
      return `<div class="bar-row movement-row">
        <div class="bar-name" title="${escapeHtml(r.team_name)}">${escapeHtml(r.team_name)}</div>
        <div class="movement-track"><span class="movement-zero"></span><span class="movement-fill ${cls}" style="${style}"></span></div>
        <div class="bar-value">${movementBadge(v)}</div>
      </div>`;
    }).join('')}</div>`;
  }

  async function loadReportCardData() {
    const [gridToFinish, gridValidation] = await Promise.all([
      fetch(DATA_FILES.gridToFinish).then(r => {
        if (!r.ok) throw new Error(`${DATA_FILES.gridToFinish}: ${r.status}`);
        return r.json();
      }),
      fetch(DATA_FILES.gridValidation).then(r => {
        if (!r.ok) throw new Error(`${DATA_FILES.gridValidation}: ${r.status}`);
        return r.json();
      })
    ]);
    return { gridToFinish, gridValidation };
  }

  function renderReportCards(gridToFinish, gridValidation) {
    const panel = $('reportCards');
    if (!panel) return;

    const rows = gridToFinish || [];
    const validation = gridValidation || {};
    const byGridMovement = rows.filter(r => typeof r.places_gained_from_grid === 'number');
    const byObservedMovement = rows.filter(r => typeof r.places_gained_from_first_observed === 'number');

    const moverRows = byGridMovement
      .slice()
      .sort((a, b) => Math.abs(b.places_gained_from_grid) - Math.abs(a.places_gained_from_grid))
      .slice(0, 16);
    const biggestMover = byGridMovement.slice().sort((a,b)=>b.places_gained_from_grid-a.places_gained_from_grid)[0];
    const biggestFaller = byGridMovement.slice().sort((a,b)=>a.places_gained_from_grid-b.places_gained_from_grid)[0];
    const observedRecovery = byObservedMovement.slice().sort((a,b)=>b.places_gained_from_first_observed-a.places_gained_from_first_observed)[0];
    const unknownGrid = rows.filter(r => !r.grid_data_available || r.start_position === null || r.start_position === undefined).length;
    const podiumConversion = rows
      .filter(r => r.podium && typeof r.places_gained_from_grid === 'number')
      .slice()
      .sort((a,b)=>b.places_gained_from_grid-a.places_gained_from_grid)[0];

    panel.innerHTML = `
      <div class="section-header">
        <div>
          <h2>Grid-to-Finish</h2>
          <p>Post-race movement analysis from heat sheet start position to final result, with first-observed movement kept separate because capture began after the race had started.</p>
        </div>
      </div>
      <div class="notice"><strong>Coverage note.</strong> ${escapeHtml(validation.race_context?.capture_caveat || 'Grid movement uses heat sheet start positions where available. First-observed movement is based on the first captured leaderboard snapshot.')}</div>
      <div class="kpi-row">
        ${kpi('Matched teams', validation.matched_final_teams ?? rows.length, `${fmt(validation.rows_with_high_confidence ?? 0,0)} high confidence`)}
        ${kpi('Grid data', validation.grid_data_available ? 'Available' : 'Fallback', validation.grid_data_available ? 'Heat sheet matched to final standings' : 'Using first-observed positions only')}
        ${kpi('Biggest mover', biggestMover ? `${biggestMover.team_name} ${signed(biggestMover.places_gained_from_grid)}` : '—')}
        ${kpi('Biggest faller', biggestFaller ? `${biggestFaller.team_name} ${signed(biggestFaller.places_gained_from_grid)}` : '—')}
        ${kpi('Observed recovery', observedRecovery ? `${observedRecovery.team_name} ${signed(observedRecovery.places_gained_from_first_observed)}` : '—')}
        ${kpi('Unknown grid', unknownGrid)}
      </div>
      <div class="grid cols-2">
        <div class="card"><h3>Biggest movement from grid</h3>${movementBars(moverRows, 'places_gained_from_grid')}</div>
        <div class="card"><h3>Movement highlights</h3>
          <div class="highlight-list">
            ${biggestMover ? `<div class="detail-box"><div class="metric">${signed(biggestMover.places_gained_from_grid)}</div><div class="metric-label">Biggest mover · ${escapeHtml(biggestMover.team_name)} · P${fmt(biggestMover.start_position,0)} → P${fmt(biggestMover.final_position,0)}</div></div>` : ''}
            ${biggestFaller ? `<div class="detail-box"><div class="metric">${signed(biggestFaller.places_gained_from_grid)}</div><div class="metric-label">Biggest faller · ${escapeHtml(biggestFaller.team_name)} · P${fmt(biggestFaller.start_position,0)} → P${fmt(biggestFaller.final_position,0)}</div></div>` : ''}
            ${observedRecovery ? `<div class="detail-box"><div class="metric">${signed(observedRecovery.places_gained_from_first_observed)}</div><div class="metric-label">Best first-observed recovery · ${escapeHtml(observedRecovery.team_name)} · observed P${fmt(observedRecovery.first_observed_position,0)} → P${fmt(observedRecovery.final_position,0)}</div></div>` : ''}
            ${podiumConversion ? `<div class="detail-box"><div class="metric">${signed(podiumConversion.places_gained_from_grid)}</div><div class="metric-label">Best podium conversion · ${escapeHtml(podiumConversion.team_name)} · P${fmt(podiumConversion.start_position,0)} → P${fmt(podiumConversion.final_position,0)}</div></div>` : ''}
          </div>
        </div>
      </div>
      <div class="section-header"><div><h2>Grid-to-Finish table</h2><p>Positive movement means the team finished higher than its heat sheet start position.</p></div></div>
      ${table(rows, [
        {label:'Start', key:'start_position', render:r=>r.start_position ? `P${fmt(r.start_position,0)}` : '—'},
        {label:'First observed', key:'first_observed_position', render:r=>r.first_observed_position ? `P${fmt(r.first_observed_position,0)}` : '—'},
        {label:'Finish', key:'final_position', render:r=>`P${fmt(r.final_position,0)}`},
        {label:'Grid Δ', key:'places_gained_from_grid', render:r=>movementBadge(r.places_gained_from_grid)},
        {label:'Observed Δ', key:'places_gained_from_first_observed', render:r=>movementBadge(r.places_gained_from_first_observed)},
        {label:'Team', key:'team_name'},
        {label:'Laps', key:'final_laps', render:r=>fmt(r.final_laps,0)},
        {label:'Class', key:'movement_class', render:r=>badge((r.movement_class || '').replaceAll('_', ' '), movementClass(r.places_gained_from_grid) === 'up' ? 'good' : movementClass(r.places_gained_from_grid) === 'down' ? 'bad' : '')},
        {label:'Confidence', key:'data_confidence', render:r=>badge(r.data_confidence || '—', r.data_confidence === 'high' ? 'good' : 'warn')}
      ])}`;
  }

  async function initReportCards() {
    const panel = $('reportCards');
    if (!panel) return;
    panel.innerHTML = '<div class="notice"><p>Loading Grid-to-Finish analytics…</p></div>';
    try {
      const { gridToFinish, gridValidation } = await loadReportCardData();
      renderReportCards(gridToFinish, gridValidation);
    } catch (err) {
      console.error(err);
      panel.innerHTML = `<div class="notice danger"><h2>Could not load Grid-to-Finish data</h2><p>${escapeHtml(err.message)}</p></div>`;
    }
  }

  initReportCards();
})();
