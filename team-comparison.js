(function () {
  'use strict';
  const PATHS = {
    grid: 'data/grid_to_finish.json',
    profiles: 'data/team_profiles.json',
    reports: 'data/team_report_cards.json',
    incidents: 'data/known_incidents.json'
  };
  const root = document.getElementById('comparison');
  if (!root) return;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const valid = value => typeof value === 'number' && Number.isFinite(value);
  const show = (value, places = 1) => valid(value)
    ? value.toLocaleString('en-AU', { maximumFractionDigits: places })
    : 'Unavailable';
  const signed = (value, places = 1) => valid(value)
    ? (value > 0 ? '+' : '') + show(value, places) : 'Unavailable';
  const status = value => value === null || value === undefined || value === ''
    ? 'Unavailable' : String(value);
  const numberKey = value => Number.isSafeInteger(value) && value >= 0 ? String(value) : null;
  const fromQuery = value => /^\d+$/.test(value ?? '') && Number.isSafeInteger(Number(value))
    ? String(Number(value)) : null;

  function join(grid, profiles, reports, incidents) {
    if (![grid, profiles, reports, incidents].every(Array.isArray)) throw Error('Invalid comparison data');
    const maps = [profiles, reports].map(rows => {
      const map = new Map();
      for (const row of rows) {
        const key = numberKey(row.car_no);
        if (!key || map.has(key)) throw Error('Invalid or duplicate team identifier');
        map.set(key, row);
      }
      return map;
    });
    if (grid.length !== 25 || maps.some(map => map.size !== grid.length)) {
      throw Error('Team comparison dataset does not contain 25 matched teams');
    }
    const seen = new Set();
    const incidentMap = new Map();
    for (const incident of incidents) {
      const key = numberKey(incident.car_no);
      if (!key) throw Error('Invalid incident car identifier');
      if (!incidentMap.has(key)) incidentMap.set(key, []);
      incidentMap.get(key).push(incident);
    }
    const teams = grid.map(row => {
      const key = numberKey(row.car_no);
      if (!key || seen.has(key) || !maps.every(map => map.has(key))) throw Error('Team join failed');
      seen.add(key);
      const profile = maps[0].get(key), report = maps[1].get(key);
      if ([profile, report].some(other => other.team_name !== row.team_name ||
          other.final_position !== row.final_position || other.final_laps !== row.final_laps)) {
        throw Error('Cross-file identity or official result mismatch for car ' + key);
      }
      return { key, grid: row, profile, report, incidents: incidentMap.get(key) || [] };
    });
    return teams.sort((a, b) => a.grid.final_position - b.grid.final_position);
  }

  const metrics = [
    ['Final position', 'Official final results', t => t.grid.final_position, 'P', 0, false],
    ['Completed laps', 'Official final results', t => t.grid.final_laps, 'laps', 0, true],
    ['True grid position', 'Heat-sheet starting grid', t => t.grid.start_position, 'P', 0, false],
    ['Grid → Finish movement', 'Heat-sheet grid versus official finish (positive = gained)', t => t.grid.places_gained_from_grid, 'places', 0, true],
    ['First observed position', 'Captured leaderboard baseline, not grid', t => t.grid.first_observed_position, 'P', 0, false],
    ['First observed → Finish', 'Capture-derived position movement; not verified passes', t => t.grid.places_gained_from_first_observed, 'places', 0, false],
    ['Median clean pace', 'Captured-segment clean pace (derived)', t => t.profile.median_clean_lph, 'laps/hour', 1, true],
    ['Mean clean pace', 'Captured-segment clean pace (derived)', t => t.profile.mean_clean_lph, 'laps/hour', 1, true],
    ['Pace consistency', 'Captured-segment inferred index; higher = more consistent', t => t.profile.pace_consistency_score, '/100', 1, true],
    ['Candidate delay events', 'Captured-segment inferred events, not official stops', t => t.profile.delay_event_count, 'events', 0, false],
    ['Delay burden per capture hour', 'Captured-segment inferred delay', t => t.profile.delay_minutes_per_capture_hour, 'min/hour', 1, true]
  ];
  const result = (t, getter) => {
    const n = getter(t);
    return valid(n) ? n : null;
  };
  const delta = (a, b, enabled, places, unit) => enabled && valid(a) && valid(b)
    ? signed(a - b, places) + (unit === '/100' ? ' points' : ' ' + unit)
    : 'Unavailable';
  const list = values => Array.isArray(values) && values.length
    ? '<ul>' + values.map(value => '<li>' + escape(value) + '</li>').join('') + '</ul>'
    : '<p class="small">None supplied.</p>';
  const teamContext = t => `<article class="card comparison-context">
    <h3>${escape(t.grid.team_name)} · car ${escape(t.key)}</h3>
    <p><strong>Data confidence:</strong> ${escape(status(t.report.data_confidence))} ·
    <strong>Pace confidence:</strong> ${escape(status(t.profile.pace_confidence))}</p>
    <p><strong>Anomaly status:</strong> ${escape(status(t.report.anomaly_status))} ·
    <strong>Known-incident status:</strong> ${escape(status(t.report.known_incident_status))}</p>
    <p><strong>RaceIQ score/grade:</strong> Not verified — shared denominator blocked by timing anomaly.</p>
    <h4>Confidence reasons</h4>${list(t.report.confidence_reasons)}
    <h4>Interpretation caveats</h4>${list(t.report.interpretation_caveats)}
    ${t.report.blocked_reason ? '<p><strong>Blocked analytics:</strong> ' + escape(t.report.blocked_reason) + '</p>' : ''}
    <h4>Known incidents</h4>
    ${t.incidents.length ? list(t.incidents.map(item => item.reported_note + ' ' + item.analytics_resolution)) : '<p class="small">No documented known incident for this team.</p>'}
  </article>`;

  function renderTable(a, b) {
    return `<div class="table-wrap"><table class="comparison-table">
      <thead><tr><th scope="col">Metric and provenance</th>
        <th scope="col">${escape(a.grid.team_name)} · #${escape(a.key)}</th>
        <th scope="col">${escape(b.grid.team_name)} · #${escape(b.key)}</th>
        <th scope="col">A − B</th></tr></thead>
      <tbody>${metrics.map(([label, source, getter, unit, places, difference]) => {
        const av = result(a, getter), bv = result(b, getter);
        const format = value => !valid(value) ? 'Unavailable' :
          (unit === 'P' ? 'P' + show(value, places) : show(value, places) + (unit === '/100' ? '/100' : ' ' + unit));
        return `<tr><th scope="row">${escape(label)}<span class="small comparison-source">${escape(source)}</span></th>
          <td>${escape(format(av))}</td><td>${escape(format(bv))}</td>
          <td>${escape(delta(av, bv, difference, places, unit))}</td></tr>`;
      }).join('')}</tbody></table></div>`;
  }

  function initialise(teams) {
    const byKey = new Map(teams.map(team => [team.key, team]));
    const query = new URL(window.location.href);
    const requestedA = fromQuery(query.searchParams.get('teamA'));
    const requestedB = fromQuery(query.searchParams.get('teamB'));
    let a = byKey.has(requestedA) ? requestedA : teams[0].key;
    let b = byKey.has(requestedB) && requestedB !== a ? requestedB :
      teams.find(team => team.key !== a).key;
    root.innerHTML = `<div class="section-header"><div><h2>Team Comparison Workbench</h2>
      <p>Compare any two teams using existing verified results and appropriately qualified captured-segment analytics.</p></div></div>
      <div class="notice"><strong>Interpretation boundary.</strong> Approximately the first 20 minutes were not captured. True grid position comes from the heat sheet, not the first observed leaderboard. Timing corrections (including car 73) are not verified overtakes. Competitive rankings, RaceIQ scores/grades and affected pace metrics remain blocked; inferred pace, consistency and delay are not official results.</div>
      <div class="card"><div class="comparison-selectors">
        <label for="comparisonA">Team A<select id="comparisonA"></select></label>
        <label for="comparisonB">Team B<select id="comparisonB"></select></label></div>
        <p id="comparisonMessage" class="small" role="status" aria-live="polite"></p>
        <p class="small">The address bar contains shareable selections (teamA and teamB).</p></div>
      <div id="comparisonResults" aria-live="polite"></div>`;
    const selectA = document.getElementById('comparisonA');
    const selectB = document.getElementById('comparisonB');
    const options = teams.map(t => `<option value="${escape(t.key)}">P${escape(t.grid.final_position)} · ${escape(t.grid.team_name)} (#${escape(t.key)})</option>`).join('');
    selectA.innerHTML = options;
    selectB.innerHTML = options;
    const message = document.getElementById('comparisonMessage');
    function render(updateUrl) {
      selectA.value = a;
      selectB.value = b;
      for (const opt of selectA.options) opt.disabled = opt.value === b;
      for (const opt of selectB.options) opt.disabled = opt.value === a;
      const first = byKey.get(a), second = byKey.get(b);
      document.getElementById('comparisonResults').innerHTML = renderTable(first, second) +
        '<div class="grid cols-2 comparison-details">' + teamContext(first) + teamContext(second) + '</div>';
      if (updateUrl) {
        const url = new URL(window.location.href);
        url.searchParams.set('teamA', a);
        url.searchParams.set('teamB', b);
        window.history.replaceState(window.history.state, '', url);
      }
    }
    function change(side, next) {
      if (!byKey.has(next) || (side === 'a' ? next === b : next === a)) {
        message.textContent = 'Select two different teams.';
        render(false);
        return;
      }
      if (side === 'a') a = next;
      else b = next;
      message.textContent = '';
      render(true);
    }
    selectA.addEventListener('change', () => change('a', selectA.value));
    selectB.addEventListener('change', () => change('b', selectB.value));
    window.addEventListener('popstate', () => {
      const params = new URL(window.location.href).searchParams;
      const nextA = fromQuery(params.get('teamA'));
      const nextB = fromQuery(params.get('teamB'));
      a = byKey.has(nextA) ? nextA : teams[0].key;
      b = byKey.has(nextB) && nextB !== a ? nextB : teams.find(t => t.key !== a).key;
      render(false);
    });
    if ((requestedA && !byKey.has(requestedA)) || (requestedB && !byKey.has(requestedB)) ||
        (requestedA && requestedA === requestedB)) message.textContent = 'Invalid or duplicate URL selection was replaced with a valid team.';
    render(true);
  }

  Promise.all(Object.values(PATHS).map(async path => {
    const response = await fetch(path);
    if (!response.ok) throw Error(path + ': HTTP ' + response.status);
    return response.json();
  })).then(values => initialise(join(...values))).catch(error => {
    console.error('Team comparison unavailable:', error);
    root.innerHTML = '<div class="notice danger" role="alert"><h2>Comparison unavailable</h2><p>Team comparison data could not be matched safely. No comparison metrics are shown.</p></div>';
  });

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { join, metrics, delta, fromQuery, valid };
  }
})();