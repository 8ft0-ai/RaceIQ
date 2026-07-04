function renderMethod() {
  const m = state.manifest;
  const o = state.overview;
  $('method').innerHTML = `<div class="card"><h2>Method and confidence notes</h2>
    <div class="notice"><strong>Interpretation boundary.</strong> RaceIQ is a post-race analytics dashboard. Official race results stay separate from inferred analytics. RaceIQ scores and grades are explanatory storytelling aids, not official rankings or awards.</div>
    ${(o.notes || []).map(n => `<p>${escapeHtml(n)}</p>`).join('')}
    <h3>Report Card methodology</h3>
    <div class="grid cols-2">
      <div class="detail-box"><strong>What a RaceIQ score means</strong><p>The score summarises the strength of a team’s post-race story using available official result fields plus derived signals: finish result, Grid-to-Finish movement, captured-segment pace and consistency, inferred delay burden, battle context, anomalies and known incidents.</p></div>
      <div class="detail-box"><strong>What it does not mean</strong><p>A score is not an official race ranking and does not replace LiveRC standings, race decisions, pit records or team-provided context. It should be read as a review aid that points to useful questions and patterns.</p></div>
      <div class="detail-box"><strong>Grid-to-Finish movement</strong><p>Grid-to-Finish movement compares heat sheet start position with final position. Positive movement means a team finished higher than its heat sheet start position. This is separate from any movement seen after capture began.</p></div>
      <div class="detail-box"><strong>First Observed movement</strong><p>The first approximately 20 minutes were not captured. First Observed movement compares the first captured leaderboard position with final position only. It must never be read as the team’s true grid position or full-race start.</p></div>
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
