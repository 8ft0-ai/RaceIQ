const DATA_FILES = {
  manifest: 'data/app_manifest.json',
  overview: 'data/race_overview.json',
  standings: 'data/standings.json',
  snapshots: 'data/race_replay_snapshot_summary.json',
  storyEvents: 'data/race_story_events.json',
  teamProfiles: 'data/team_profiles.json',
  teamPhase: 'data/team_phase_summary.json',
  pitEvents: 'data/pit_delay_events.json',
  pitSummary: 'data/pit_delay_team_summary.json',
  battleCards: 'data/head_to_head_battle_cards.json',
  battlePairs: 'data/head_to_head_pairs.json',
  passEvents: 'data/head_to_head_pass_events.json',
  anomalies: 'data/anomaly_review_board.json',
  incidents: 'data/known_incidents.json',
  traces: 'data/replay_traces_top12.json'
};

const state = {};
const $ = (id) => document.getElementById(id);
const fmt = (v, digits = 1) => (v === null || v === undefined || Number.isNaN(v)) ? '—' : (typeof v === 'number' ? v.toLocaleString('en-AU', { maximumFractionDigits: digits }) : v);
const pct = (v, digits = 0) => v === null || v === undefined ? '—' : `${Number(v).toFixed(digits)}%`;
const escapeHtml = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

async function loadData() {
  const entries = await Promise.all(Object.entries(DATA_FILES).map(async ([key, url]) => [key, await fetch(url).then(r => {
    if (!r.ok) throw new Error(`${url}: ${r.status}`);
    return r.json();
  })]));
  for (const [k, v] of entries) state[k] = v;
}

function initTabs() {
  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      $(btn.dataset.tab).classList.add('active');
    });
  });
}

function kpi(label, value, note = '') {
  return `<div class="kpi"><div class="metric">${escapeHtml(value)}</div><div class="metric-label">${escapeHtml(label)}</div>${note ? `<p class="small">${escapeHtml(note)}</p>` : ''}</div>`;
}

function badge(text, cls = '') { return `<span class="badge ${cls}">${escapeHtml(text)}</span>`; }

function table(rows, columns, empty = 'No data') {
  if (!rows || !rows.length) return `<div class="notice"><p>${empty}</p></div>`;
  return `<div class="table-wrap"><table><thead><tr>${columns.map(c => `<th>${escapeHtml(c.label)}</th>`).join('')}</tr></thead><tbody>` +
    rows.map(r => `<tr>${columns.map(c => `<td>${c.render ? c.render(r) : escapeHtml(fmt(r[c.key]))}</td>`).join('')}</tr>`).join('') +
    `</tbody></table></div>`;
}

function bars(rows, nameKey, valueKey, opts = {}) {
  const vals = rows.map(r => Number(r[valueKey]) || 0);
  const max = Math.max(...vals, 1);
  return `<div class="chart">${rows.map(r => {
    const v = Number(r[valueKey]) || 0;
    const w = Math.max(1, Math.round((v / max) * 100));
    return `<div class="bar-row"><div class="bar-name" title="${escapeHtml(r[nameKey])}">${escapeHtml(r[nameKey])}</div><div class="bar-track"><div class="bar-fill" style="width:${w}%"></div></div><div class="bar-value">${escapeHtml(opts.format ? opts.format(v) : fmt(v))}</div></div>`;
  }).join('')}</div>`;
}

function renderHero() {
  const o = state.overview;
  const podium = (o.podium || []).map(p => `${p.final_position}. ${p.team_name} (${p.final_laps} laps)`).join('<br>');
  $('heroStatus').innerHTML = `<h3>Final podium</h3><p>${podium}</p><p class="small">Generated ${escapeHtml(o.generated_at_utc)} · ${escapeHtml(o.coverage_note || '')}</p>`;
}

function renderOverview() {
  const o = state.overview;
  const c = o.summary_counts;
  $('overview').innerHTML = `
    <div class="notice"><strong>Coverage-aware model.</strong> Data collection began after the race had already started. Opening lead changes, pits and incidents are not inferred.</div>
    <div class="kpi-row">
      ${kpi('Teams', c.teams)}
      ${kpi('Snapshots', c.snapshots)}
      ${kpi('Lead changes', c.lead_changes)}
      ${kpi('Pit / delay events', c.pit_delay_events)}
      ${kpi('Battle pairs', c.battle_pairs)}
      ${kpi('Open anomalies', c.open_anomalies)}
    </div>
    <div class="grid cols-2">
      <div class="card"><h2>Final standings</h2>${bars(state.standings.slice(0, 12), 'team_name', 'final_laps', { format: v => fmt(v,0) })}</div>
      <div class="card"><h2>Top pace profiles</h2>${bars(o.top_pace, 'team_name', 'median_clean_lph', { format: v => `${fmt(v)} lph` })}</div>
    </div>
    <div class="section-header"><div><h2>Top race stories</h2><p>Battle cards and delay burden are generated from validated, coverage-aware marts.</p></div></div>
    <div class="grid cols-2">
      <div class="card"><h3>Best head-to-head battles</h3>${(o.top_battles||[]).map(b => `<div class="story-item"><div class="story-title">${escapeHtml(b.team_name_a)} v ${escapeHtml(b.team_name_b)}</div><p>${escapeHtml(b.battle_card_narrative)}</p><div class="story-meta">Score ${fmt(b.battle_score)} · ${escapeHtml(b.battle_class)} · ${fmt(b.lead_switches,0)} lead switches</div></div>`).join('')}</div>
      <div class="card"><h3>Largest inferred delay burden</h3>${table(o.top_delay_burden, [
        {label:'Team', key:'team_name'},
        {label:'Events', key:'delay_burden_event_count', render:r=>fmt(r.delay_burden_event_count,0)},
        {label:'Laps lost', key:'estimated_laps_lost_total', render:r=>fmt(r.estimated_laps_lost_total,1)},
        {label:'Profile', key:'delay_profile_label'}
      ])}</div>
    </div>`;
}

function lineChart(data, seriesKey, xKey, yKey, opts = {}) {
  const width = 980, height = opts.height || 320, pad = {l: 40, r: 20, t: 18, b: 36};
  const xs = data.map(d => Number(d[xKey])).filter(Number.isFinite);
  const ys = data.map(d => Number(d[yKey])).filter(Number.isFinite);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = opts.minY ?? Math.min(...ys), maxY = opts.maxY ?? Math.max(...ys);
  const sx = x => pad.l + ((x - minX) / Math.max(maxX - minX, 1)) * (width - pad.l - pad.r);
  const sy = y => pad.t + ((maxY - y) / Math.max(maxY - minY, 1)) * (height - pad.t - pad.b);
  const groups = new Map();
  for (const d of data) {
    const k = d[seriesKey];
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(d);
  }
  const colours = ['#6ee7ff','#a78bfa','#3ddc97','#ffd166','#ff6b6b','#9ef01a','#f15bb5','#00bbf9','#fca311','#b8f2e6','#cdb4db','#fdffb6'];
  let paths = '';
  let legend = '';
  [...groups.entries()].forEach(([name, rows], i) => {
    const pts = rows.sort((a,b)=>a[xKey]-b[xKey]).map(d => `${sx(Number(d[xKey])).toFixed(1)},${sy(Number(d[yKey])).toFixed(1)}`).join(' ');
    const col = colours[i % colours.length];
    paths += `<polyline points="${pts}" fill="none" stroke="${col}" stroke-width="2.1" opacity=".88" />`;
    legend += `<span class="badge" style="border-color:${col};color:${col}">${escapeHtml(name)}</span>`;
  });
  return `<div class="chart"><svg class="svg-chart" viewBox="0 0 ${width} ${height}" role="img">
      <line x1="${pad.l}" y1="${height-pad.b}" x2="${width-pad.r}" y2="${height-pad.b}" stroke="rgba(255,255,255,.22)" />
      <line x1="${pad.l}" y1="${pad.t}" x2="${pad.l}" y2="${height-pad.b}" stroke="rgba(255,255,255,.22)" />
      ${[0,.25,.5,.75,1].map(t => `<line x1="${pad.l}" x2="${width-pad.r}" y1="${pad.t + t*(height-pad.t-pad.b)}" y2="${pad.t + t*(height-pad.t-pad.b)}" stroke="rgba(255,255,255,.06)" />`).join('')}
      ${paths}
      <text x="${pad.l}" y="${height-10}" fill="rgba(255,255,255,.55)" font-size="12">race time →</text>
      <text x="6" y="${pad.t+8}" fill="rgba(255,255,255,.55)" font-size="12">${escapeHtml(opts.yLabel || yKey)}</text>
    </svg><div class="controls">${legend}</div></div>`;
}

function renderReplay() {
  const snapshots = state.snapshots;
  const events = state.storyEvents;
  const traces = state.traces;
  const last = snapshots[snapshots.length - 1];
  $('replay').innerHTML = `
    <div class="section-header"><div><h2>Race replay timeline</h2><p>Use the slider to step through captured race state. The replay starts from the first collected snapshot, not the race start.</p></div></div>
    <div class="grid cols-2">
      <div class="card timeline-card">
        <div class="controls"><input id="replaySlider" type="range" min="0" max="${snapshots.length-1}" value="${snapshots.length-1}" /><span id="replayClock" class="badge"></span></div>
        <div id="replayState"></div>
      </div>
      <div class="card"><h3>Top-12 position traces</h3>${lineChart(traces, 'team_name', 'race_clock_seconds', 'position', { minY: 1, maxY: 25, yLabel: 'position' })}</div>
    </div>
    <div class="section-header"><div><h2>Curated event stream</h2><p>High-value replay events including the unobserved opening segment, capture baseline, lead changes, podium changes and major incidents.</p></div></div>
    <div class="story-list">${events.slice(0, 220).map(e => `<div class="story-item ${escapeHtml(e.severity)}"><div class="story-title">${escapeHtml(e.race_clock_display)} · ${escapeHtml(e.title)}</div><p>${escapeHtml(e.details)}</p><div class="story-meta">${escapeHtml(e.event_type)} · ${escapeHtml(e.severity)} · ${escapeHtml(e.team_name || '')}</div></div>`).join('')}</div>`;
  const slider = $('replaySlider');
  const update = () => {
    const s = snapshots[Number(slider.value)];
    $('replayClock').textContent = `Race clock ${s.race_clock_display} · snapshot ${s.snapshot_id}`;
    $('replayState').innerHTML = `<div class="timeline-now">
      <div class="detail-box"><div class="metric">${escapeHtml(s.leader_team_name)}</div><div class="metric-label">Leader · lap ${fmt(s.leader_lap,0)}</div></div>
      <div class="detail-box"><div class="metric">${escapeHtml(s.p2_team_name)}</div><div class="metric-label">P2 · gap ${fmt(s.lead_gap_to_p2_laps,0)} laps</div></div>
      <div class="detail-box"><div class="metric">${escapeHtml(s.p3_team_name)}</div><div class="metric-label">P3</div></div>
      </div><div class="notice"><strong>Top 5:</strong><br>${escapeHtml(s.top5_order || '')}</div>
      <p class="small">Leader changed: ${s.leader_changed ? 'yes' : 'no'} · Active delays: ${fmt(s.active_delay_count,0)} · Race story confidence: ${escapeHtml(s.race_story_confidence || '—')}</p>`;
  };
  slider.addEventListener('input', update); update();
}

function renderTeams() {
  const teams = state.teamProfiles;
  $('teams').innerHTML = `
    <div class="section-header"><div><h2>Team pace profiles</h2><p>Select a team to inspect clean sustained pace, consistency, delay burden and coverage-aware interpretation.</p></div><select id="teamSelect"></select></div>
    <div class="grid cols-3" id="teamCards"></div>
    <div class="section-header"><div><h2>Selected team</h2></div></div>
    <div id="teamDetail"></div>`;
  const select = $('teamSelect');
  select.innerHTML = teams.map(t => `<option value="${t.car_no}">${t.final_position}. ${escapeHtml(t.team_name)}</option>`).join('');
  const cardHtml = teams.map(t => `<div class="card team-card" data-car="${t.car_no}"><h3>${t.final_position}. ${escapeHtml(t.team_name)}</h3><p>${escapeHtml(t.profile_headline || '')}</p><div class="controls">${badge(`${fmt(t.median_clean_lph)} lph`)} ${badge(`${fmt(t.pace_consistency_score)} consistency`)}</div></div>`).join('');
  $('teamCards').innerHTML = cardHtml;
  const render = (carNo) => {
    document.querySelectorAll('.team-card').forEach(c => c.classList.toggle('selected', String(c.dataset.car) === String(carNo)));
    const t = teams.find(x => String(x.car_no) === String(carNo)) || teams[0];
    $('teamDetail').innerHTML = `<div class="grid cols-2">
      <div class="card"><h3>${escapeHtml(t.team_name)}</h3><p>${escapeHtml(t.profile_narrative || '')}</p><div class="kpi-row" style="grid-template-columns:repeat(3,1fr)">
        ${kpi('Final position', t.final_position)}${kpi('Final laps', t.final_laps)}${kpi('Clean pace', `${fmt(t.median_clean_lph)} lph`)}
        ${kpi('Consistency', `${fmt(t.pace_consistency_score)}/100`)}${kpi('Reliability', `${fmt(t.race_reliability_score)}/100`)}${kpi('Delay burden', t.total_delay_display || '—')}
      </div></div>
      <div class="card"><h3>Phase pace</h3>${bars([
        {phase:'Opening', value:t.opening_median_lph},{phase:'Middle', value:t.middle_median_lph},{phase:'Closing', value:t.closing_median_lph},{phase:'Final hour', value:t.final_hour_median_lph}
      ], 'phase', 'value', {format:v=>`${fmt(v)} lph`})}</div>
    </div>`;
  };
  select.addEventListener('change', () => render(select.value));
  document.querySelectorAll('.team-card').forEach(c => c.addEventListener('click', () => { select.value = c.dataset.car; render(c.dataset.car); }));
  render(teams[0]?.car_no);
}

function renderDelays() {
  const summary = state.pitSummary;
  const events = state.pitEvents;
  $('delays').innerHTML = `
    <div class="section-header"><div><h2>Pit / delay map</h2><p>Classification is probabilistic. Use the event table for team review, not as official pit records.</p></div></div>
    <div class="grid cols-2">
      <div class="card"><h3>Estimated laps lost by team</h3>${bars(summary.slice(0,15), 'team_name', 'estimated_laps_lost_total', {format:v=>fmt(v,1)})}</div>
      <div class="card"><h3>Delay burden summary</h3>${table(summary.slice(0,10), [
        {label:'Team', key:'team_name'}, {label:'Events', key:'delay_burden_event_count', render:r=>fmt(r.delay_burden_event_count,0)}, {label:'Laps lost', key:'estimated_laps_lost_total', render:r=>fmt(r.estimated_laps_lost_total,1)}, {label:'Profile', key:'delay_profile_label'}
      ])}</div>
    </div>
    <div class="section-header"><div><h2>Event review table</h2></div><div class="controls"><select id="delayFilter"><option value="all">All event types</option>${[...new Set(events.map(e=>e.event_type))].sort().map(e=>`<option>${escapeHtml(e)}</option>`).join('')}</select></div></div>
    <div id="delayTable"></div>`;
  const renderTable = () => {
    const f = $('delayFilter').value;
    const rows = (f === 'all' ? events : events.filter(e => e.event_type === f)).slice(0, 160);
    $('delayTable').innerHTML = table(rows, [
      {label:'Clock', key:'start_race_clock_display'}, {label:'Team', key:'team_name'}, {label:'Type', key:'event_type'}, {label:'Severity', key:'severity', render:r=>badge(r.severity, r.severity === 'critical' ? 'bad' : r.severity === 'high' ? 'warn' : '')}, {label:'Duration', key:'duration_display'}, {label:'Laps lost', key:'estimated_laps_lost', render:r=>fmt(r.estimated_laps_lost,1)}, {label:'Reason', key:'classification_reason'}
    ]);
  };
  $('delayFilter').addEventListener('change', renderTable); renderTable();
}

function renderBattles() {
  const cards = state.battleCards;
  const pairs = state.battlePairs;
  const passes = state.passEvents;
  $('battles').innerHTML = `
    <div class="section-header"><div><h2>Head-to-head battles</h2><p>Battle cards combine close-running time, lead switches, comeback signal and final result.</p></div></div>
    <div class="grid cols-3">${cards.slice(0,12).map(b => `<div class="card"><h3>#${b.battle_rank} · ${escapeHtml(b.team_name_a)} v ${escapeHtml(b.team_name_b)}</h3><p>${escapeHtml(b.battle_card_narrative)}</p><div class="controls">${badge(`Score ${fmt(b.battle_score)}`)} ${badge(`${fmt(b.lead_switches,0)} switches`)} ${badge(escapeHtml(b.battle_class))}</div></div>`).join('')}</div>
    <div class="section-header"><div><h2>Pair rankings</h2></div></div>
    ${table(pairs.slice(0,40), [
      {label:'Rank', key:'battle_rank', render:r=>`<span class="rank">${fmt(r.battle_rank,0)}</span>`}, {label:'Pair', key:'battle_pair_key', render:r=>`${escapeHtml(r.team_name_a)} v ${escapeHtml(r.team_name_b)}`}, {label:'Winner', key:'final_pair_winner'}, {label:'Lead switches', key:'lead_switches', render:r=>fmt(r.lead_switches,0)}, {label:'Close %', key:'close_3_lap_pct', render:r=>pct(r.close_3_lap_pct,1)}, {label:'Battle score', key:'battle_score', render:r=>fmt(r.battle_score,1)}, {label:'Summary', key:'battle_summary'}
    ])}
    <div class="section-header"><div><h2>Pass / lead-switch events</h2></div></div>
    ${table(passes.slice(0,120), [
      {label:'Clock', key:'race_clock_display'}, {label:'Passing', key:'passing_team_name'}, {label:'Passed', key:'passed_team_name'}, {label:'Context', key:'pass_context'}
    ])}`;
}

function renderAnomalies() {
  const rows = state.anomalies;
  const byType = [...rows.reduce((m, r) => m.set(r.anomaly_type, (m.get(r.anomaly_type)||0)+1), new Map()).entries()].map(([type,count])=>({type,count})).sort((a,b)=>b.count-a.count);
  $('anomalies').innerHTML = `
    <div class="section-header"><div><h2>Anomaly review board</h2><p>Open review items remain separated from confirmed known incidents. These should be checked against raw timing export, pit sheets or race notes.</p></div></div>
    <div class="grid cols-2">
      <div class="card"><h3>Open items by type</h3>${bars(byType, 'type', 'count', {format:v=>fmt(v,0)})}</div>
      <div class="card"><h3>Known incidents</h3>${table(state.incidents, [
        {label:'Team', key:'team_name'}, {label:'Type', key:'incident_type'}, {label:'Status', key:'incident_status'}, {label:'Resolution', key:'analytics_resolution'}
      ])}</div>
    </div>
    <div class="section-header"><div><h2>Open anomaly items</h2></div></div>
    ${table(rows.slice(0,220), [
      {label:'Severity', key:'severity', render:r=>badge(r.severity, r.severity === 'critical' ? 'bad' : r.severity === 'high' ? 'warn' : '')}, {label:'Type', key:'anomaly_type'}, {label:'Team', key:'team_name'}, {label:'Clock', key:'timestamp_utc'}, {label:'Metric', key:'metric_value', render:r=>`${fmt(r.metric_value)} ${escapeHtml(r.metric_name || '')}`}, {label:'Details', key:'details'}, {label:'Action', key:'recommended_action'}
    ])}`;
}

function renderMethod() {
  const m = state.manifest;
  const o = state.overview;
  $('method').innerHTML = `<div class="card"><h2>Method and confidence notes</h2>
    <div class="notice"><strong>Interpretation boundary.</strong> RaceIQ is a post-race analytics dashboard. Official race results stay separate from inferred analytics. RaceIQ scores and grades are explanatory storytelling aids, not official rankings or awards.</div>
    ${(o.notes || []).map(n => `<p>${escapeHtml(n)}</p>`).join('')}
    <h3>Report Card methodology</h3>
    <div class="grid cols-2">
      <div class="detail-box"><strong>What a RaceIQ score means</strong><p>The score summarises the strength of a team's post-race story using available official result fields plus derived signals: finish result, Grid-to-Finish movement, captured-segment pace and consistency, inferred delay burden, battle context, anomalies and known incidents.</p></div>
      <div class="detail-box"><strong>What it does not mean</strong><p>A score is not an official race ranking and does not replace LiveRC standings, race decisions, pit records or team-provided context. It should be read as a review aid that points to useful questions and patterns.</p></div>
      <div class="detail-box"><strong>Grid-to-Finish movement</strong><p>Grid-to-Finish movement compares heat sheet start position with final position. Positive movement means a team finished higher than its heat sheet start position. This is separate from any movement seen after capture began.</p></div>
      <div class="detail-box"><strong>First Observed movement</strong><p>The first approximately 20 minutes were not captured. First Observed movement compares the first captured leaderboard position with final position only. It must never be read as the team's true grid position or full-race start.</p></div>
      <div class="detail-box"><strong>Inferred delay burden</strong><p>Delay burden estimates captured-segment time and laps lost from timing patterns such as stop-like gaps, unusually slow periods and lap-rate changes. It is probabilistic and is not an official pit-stop or repair log.</p></div>
      <div class="detail-box"><strong>Anomalies and known incidents</strong><p>Anomaly status flags data that needs review, such as timing irregularities or unusual jumps. Confirmed known incidents remain visible and are used to explain or exclude affected rows from performance inference where appropriate.</p></div>
      <div class="detail-box"><strong>Battle signals</strong><p>Head-to-head battle signals combine close-running time, lead switches, comeback signal and final-order relevance. They describe captured race dynamics, not official overtaking rulings.</p></div>
      <div class="detail-box"><strong>Validation artefacts</strong><p>The dashboard keeps validation context visible through the app manifest, coverage table, Grid-to-Finish validation, anomaly review board and known incident list. These artefacts explain confidence, caveats and data-source boundaries.</p></div>
    </div>
    <h3>Reading the Method tab</h3>
    <p>Use official final position and final laps as the race result. Use RaceIQ scores, grades, movement, delay burden, battle cards and anomaly labels as inferred context that helps explain how that result may have developed within the observed data.</p>
    <h3>Coverage</h3>
    ${table(Object.entries(o.coverage || {}).map(([metric, v]) => ({metric, ...v})), [
      {label:'Metric', key:'metric'}, {label:'Display', key:'display'}, {label:'Value', key:'value'}, {label:'Note', key:'note'}
    ])}
    <h3>How to run locally</h3><pre><code>${escapeHtml(m.recommended_command)}
# then open ${escapeHtml(m.open_url)}</code></pre>
    <p class="small">Version ${escapeHtml(m.version)} · Generated ${escapeHtml(m.generated_at_utc)} · Source: ${escapeHtml(m.source)}</p>
  </div>`;
}

function renderAll() {
  renderHero(); renderOverview(); renderReplay(); renderTeams(); renderDelays(); renderBattles(); renderAnomalies(); renderMethod();
}

(async function main() {
  initTabs();
  try {
    await loadData();
    renderAll();
  } catch (err) {
    console.error(err);
    document.querySelector('main').innerHTML = document.getElementById('errorTemplate').innerHTML;
    $('heroStatus').textContent = 'Data loading failed';
  }
})();
