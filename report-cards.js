(() => {
  const DATA_FILES = {
    gridToFinish: 'data/grid_to_finish.json',
    gridValidation: 'data/grid_to_finish_validation.json',
    teamReportCards: 'data/team_report_cards.json'
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

  function scoreClass(score) {
    const n = Number(score);
    if (!Number.isFinite(n)) return 'neutral';
    if (n >= 80) return 'good';
    if (n >= 55) return 'warn';
    return 'bad';
  }

  function gradeClass(grade) {
    const g = String(grade || '').toUpperCase();
    if (g === 'A+' || g === 'A' || g === 'B') return 'good';
    if (g === 'C' || g === 'D') return 'warn';
    return 'bad';
  }

  function confidenceClass(value) {
    const v = String(value || '').toLowerCase();
    if (v === 'high') return 'good';
    if (v === 'medium' || v === 'usable_with_context') return 'warn';
    if (v === 'low') return 'bad';
    return 'warn';
  }

  function confidenceLabel(team) {
    return team.data_confidence || team.report_card_confidence || 'not separately assigned';
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
    const [gridToFinish, gridValidation, teamReportCards] = await Promise.all([
      fetch(DATA_FILES.gridToFinish).then(r => {
        if (!r.ok) throw new Error(`${DATA_FILES.gridToFinish}: ${r.status}`);
        return r.json();
      }),
      fetch(DATA_FILES.gridValidation).then(r => {
        if (!r.ok) throw new Error(`${DATA_FILES.gridValidation}: ${r.status}`);
        return r.json();
      }),
      fetch(DATA_FILES.teamReportCards).then(r => {
        if (!r.ok) throw new Error(`${DATA_FILES.teamReportCards}: ${r.status}`);
        return r.json();
      })
    ]);
    return { gridToFinish, gridValidation, teamReportCards };
  }

  function teamOptionLabel(team) {
    return `${team.final_position}. ${team.team_name} · ${team.report_card_grade || '—'} · ${fmt(team.report_card_score, 1)}`;
  }

  function renderSummaryBullets(team) {
    const bullets = Array.isArray(team.summary_bullets) ? team.summary_bullets : [];
    return bullets.length
      ? `<ul class="report-bullets">${bullets.map(b => `<li>${escapeHtml(b)}</li>`).join('')}</ul>`
      : '<p class="small">No summary bullets available.</p>';
  }

  function renderTextList(items, empty) {
    const list = Array.isArray(items) ? items.filter(Boolean) : [];
    return list.length
      ? `<ul class="report-bullets compact">${list.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
      : `<p class="small">${escapeHtml(empty)}</p>`;
  }

  function renderCaveats(team) {
    return `<div class="notice confidence-panel">
      <div class="confidence-panel-head">
        <strong>Confidence: ${escapeHtml(confidenceLabel(team))}</strong>
        ${badge(confidenceLabel(team), confidenceClass(confidenceLabel(team)))}
      </div>
      <div class="grid cols-2">
        <div>
          <h3>Confidence reasons</h3>
          ${renderTextList(team.confidence_reasons, 'No confidence reasons supplied.')}
        </div>
        <div>
          <h3>Interpretation caveats</h3>
          ${renderTextList(team.interpretation_caveats, 'No interpretation caveats supplied.')}
        </div>
      </div>
    </div>`;
  }

  function renderTeamDetail(team) {
    if (!team) return '<div class="notice"><p>Select a team to view its report card.</p></div>';
    const confidence = confidenceLabel(team);
    return `<div class="card report-card-detail">
      <div class="report-card-hero">
        <div>
          <div class="eyebrow">Selected team report card</div>
          <h2>${escapeHtml(team.team_name)}</h2>
          <p>${escapeHtml(team.headline || 'No headline available.')}</p>
          <div class="controls">
            ${badge(`Grade ${team.report_card_grade || '—'}`, gradeClass(team.report_card_grade))}
            ${badge(`RaceIQ ${fmt(team.report_card_score, 1)}/100`, scoreClass(team.report_card_score))}
            ${badge(`Final P${fmt(team.final_position, 0)}`)}
            ${badge(`${fmt(team.final_laps, 0)} laps`)}
            ${badge(`Confidence ${confidence}`, confidenceClass(confidence))}
          </div>
        </div>
        <div class="grade-tile ${gradeClass(team.report_card_grade)}">
          <div class="grade-value">${escapeHtml(team.report_card_grade || '—')}</div>
          <div class="metric-label">RaceIQ grade</div>
          <div class="grade-score">${fmt(team.report_card_score, 1)}/100</div>
        </div>
      </div>
      <div class="kpi-row report-kpis">
        ${kpi('Finish', `P${fmt(team.final_position, 0)}`, `${fmt(team.final_laps, 0)} laps`)}
        ${kpi('Grid start', team.start_position ? `P${fmt(team.start_position, 0)}` : '—')}
        ${kpi('First observed', team.first_observed_position ? `P${fmt(team.first_observed_position, 0)}` : '—')}
        ${kpi('Grid movement', signed(team.places_gained), 'Grid → Finish')}
        ${kpi('Observed movement', signed(team.places_gained_from_first_observed), 'First observed → Finish')}
        ${kpi('Delay burden', fmt(team.estimated_laps_lost, 1), team.delay_profile || '—')}
      </div>
      <div class="grid cols-2">
        <div>
          <h3>Race story</h3>
          ${renderSummaryBullets(team)}
          ${renderCaveats(team)}
        </div>
        <div class="report-facts">
          <div class="detail-box"><strong>Pace profile</strong><p>${escapeHtml(team.pace_label || '—')} · ${fmt(team.median_clean_lph, 1)} clean lph</p></div>
          <div class="detail-box"><strong>Consistency</strong><p>${fmt(team.consistency_score, 1)}/100</p></div>
          <div class="detail-box"><strong>Best phase</strong><p>${escapeHtml(team.best_phase || '—')}</p></div>
          <div class="detail-box"><strong>Key battle</strong><p>${escapeHtml(team.key_battle || '—')}</p></div>
          <div class="detail-box"><strong>Confidence</strong><p>${escapeHtml(confidence)} · see reasons and caveats in the race story panel</p></div>
        </div>
      </div>
    </div>`;
  }

  function renderTeamReportCards(teamReportCards) {
    const teams = (teamReportCards || []).slice().sort((a, b) => Number(a.final_position) - Number(b.final_position));
    if (!teams.length) return '<div class="notice"><p>No team report cards available.</p></div>';

    const bestScore = teams.slice().sort((a,b)=>Number(b.report_card_score || 0)-Number(a.report_card_score || 0))[0];
    const winner = teams.find(t => Number(t.final_position) === 1) || teams[0];
    const bestRecovery = teams.slice().sort((a,b)=>Number(b.places_gained || 0)-Number(a.places_gained || 0))[0];
    const caveatedTeams = teams.filter(t => (t.known_incident_status && t.known_incident_status !== 'none') || (t.anomaly_status && t.anomaly_status !== 'none')).length;
    const avgScore = teams.reduce((sum, t) => sum + (Number(t.report_card_score) || 0), 0) / Math.max(teams.length, 1);

    return `
      <div class="section-header">
        <div>
          <h2>Team Report Cards</h2>
          <p>Each card combines finish result, grid movement, pace, consistency, inferred delay burden, battles, anomalies and known incidents into a post-race profile for review.</p>
        </div>
        <select id="teamReportSelect" aria-label="Select team report card">
          ${teams.map(t => `<option value="${escapeHtml(t.car_no)}">${escapeHtml(teamOptionLabel(t))}</option>`).join('')}
        </select>
      </div>
      <div class="notice"><strong>Interpretation note.</strong> RaceIQ scores and grades are explanatory storytelling aids, not official race rankings. First-observed movement is separate from true Grid → Finish movement because capture started after the race began. Caveats remain visible where anomalies or known incidents affect interpretation.</div>
      <div class="kpi-row">
        ${kpi('Highest RaceIQ', bestScore ? `${bestScore.team_name} ${fmt(bestScore.report_card_score, 1)}` : '—', 'explanatory score')}
        ${kpi('Winner', winner ? winner.team_name : '—', winner ? `Grade ${winner.report_card_grade || '—'}` : '')}
        ${kpi('Best grid recovery', bestRecovery ? `${bestRecovery.team_name} ${signed(bestRecovery.places_gained)}` : '—')}
        ${kpi('Cards', teams.length)}
        ${kpi('Average score', fmt(avgScore, 1), 'not an official metric')}
        ${kpi('With caveats', caveatedTeams)}
      </div>
      <div class="grid cols-3 team-report-grid">
        ${teams.slice(0, 6).map(t => `<button class="card team-report-card" data-car="${escapeHtml(t.car_no)}">
          <div class="team-report-card-head">
            <span class="rank">P${fmt(t.final_position, 0)}</span>
            <span class="grade-mini ${gradeClass(t.report_card_grade)}">${escapeHtml(t.report_card_grade || '—')}</span>
          </div>
          <h3>${escapeHtml(t.team_name)}</h3>
          <p>${escapeHtml(t.headline || '')}</p>
          <div class="controls">
            ${badge(`Score ${fmt(t.report_card_score, 1)}`, scoreClass(t.report_card_score))}
            ${badge(`Grid ${signed(t.places_gained)}`, movementClass(t.places_gained) === 'up' ? 'good' : movementClass(t.places_gained) === 'down' ? 'bad' : '')}
          </div>
        </button>`).join('')}
      </div>
      <div class="section-header"><div><h2>Selected team</h2><p>Use the selector or highlight cards to inspect a team’s full post-race profile.</p></div></div>
      <div id="teamReportDetail"></div>
    `;
  }

  function attachTeamReportInteractions(teamReportCards) {
    const teams = teamReportCards || [];
    const select = $('teamReportSelect');
    const detail = $('teamReportDetail');
    if (!select || !detail || !teams.length) return;

    const bestScore = teams.slice().sort((a,b)=>Number(b.report_card_score || 0)-Number(a.report_card_score || 0))[0];
    const initial = bestScore || teams.find(t => Number(t.final_position) === 1) || teams[0];

    const render = (carNo) => {
      const team = teams.find(t => String(t.car_no) === String(carNo)) || initial;
      if (!team) return;
      select.value = String(team.car_no);
      detail.innerHTML = renderTeamDetail(team);
      document.querySelectorAll('.team-report-card').forEach(card => {
        card.classList.toggle('selected', String(card.dataset.car) === String(team.car_no));
      });
    };

    select.addEventListener('change', () => render(select.value));
    document.querySelectorAll('.team-report-card').forEach(card => {
      card.addEventListener('click', () => render(card.dataset.car));
    });
    render(initial.car_no);
  }

  function renderGridToFinish(gridToFinish, gridValidation) {
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

    return `
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

  function renderReportCards(gridToFinish, gridValidation, teamReportCards) {
    const panel = $('reportCards');
    if (!panel) return;
    panel.innerHTML = `
      ${renderTeamReportCards(teamReportCards)}
      ${renderGridToFinish(gridToFinish, gridValidation)}
    `;
    attachTeamReportInteractions(teamReportCards);
  }

  async function initReportCards() {
    const panel = $('reportCards');
    if (!panel) return;
    panel.innerHTML = '<div class="notice"><p>Loading report card analytics…</p></div>';
    try {
      const { gridToFinish, gridValidation, teamReportCards } = await loadReportCardData();
      renderReportCards(gridToFinish, gridValidation, teamReportCards);
    } catch (err) {
      console.error(err);
      panel.innerHTML = `<div class="notice danger"><h2>Could not load report card data</h2><p>${escapeHtml(err.message)}</p></div>`;
    }
  }

  initReportCards();
})();
