const { chromium } = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    const base = 'http://127.0.0.1:8000/';
    await page.goto(base + '?teamA=73&teamB=58', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Compare teams' }).click();
    await page.locator('#comparisonA').waitFor();
    assert.equal(await page.locator('#comparisonA').inputValue(), '73');
    assert.equal(await page.locator('#comparisonB').inputValue(), '58');
    assert.equal(await page.locator('#comparisonA option').count(), 25);
    const table = page.locator('.comparison-table');
    assert.match(await table.innerText(), /Not verified|Unavailable/);
    assert.match(await page.locator('#comparison').innerText(), /first 20 minutes/i);
    assert.match(await page.locator('#comparison').innerText(), /transponder issue/i);
    assert.match(await page.locator('#comparison').innerText(), /timing correction/i);
    let pace = page.locator('.comparison-table tr', { hasText: 'Median clean pace' });
    assert.match(await pace.innerText(), /Unavailable/);
    assert.match(await pace.innerText(), /169\.1/);
    await page.locator('#comparisonA').selectOption('5');
    assert.equal(new URL(page.url()).searchParams.get('teamA'), '5');
    assert.equal(await page.locator('#comparisonB').inputValue(), '58');
    assert.match(await pace.innerText(), /178\.7/);
    assert.doesNotMatch(await pace.innerText(), /Unavailable/);
    assert.ok((await pace.innerText()).includes('+9.6 laps/hour')); // A minus B
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Compare teams' }).click();
    assert.equal(await page.locator('#comparisonA').inputValue(), '5');
    assert.equal(await page.locator('#comparisonB').inputValue(), '58');
    assert.equal(await page.locator('#comparisonB option[value="5"]').evaluate(option => option.disabled), true);
    await page.locator('#comparisonB').selectOption('2');
    assert.equal(await page.locator('#comparisonA').inputValue(), '5');
    assert.equal(new URL(page.url()).searchParams.get('teamB'), '2');
    assert.match(await page.locator('.comparison-table').innerText(), /Oakwood Blue/);
    await page.goto(base + '?teamA=not-a-team&teamB=not-a-team', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Compare teams' }).click();
    assert.notEqual(await page.locator('#comparisonA').inputValue(), await page.locator('#comparisonB').inputValue());
    await page.goto(base + '?teamA=73&teamB=73', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Compare teams' }).click();
    assert.notEqual(await page.locator('#comparisonA').inputValue(), await page.locator('#comparisonB').inputValue());
    await page.getByRole('button', { name: 'Report cards' }).click();
    assert.equal(await page.locator('#reportCards').isVisible(), true);
    assert.match(await page.locator('#reportCards').innerText(), /Not verified/i);
    await page.getByRole('button', { name: 'Overview' }).click();
    assert.equal(await page.locator('#overview').isVisible(), true);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: 'Compare teams' }).click();
    assert.equal(await page.locator('#comparisonA').isVisible(), true);
    await page.locator('#comparisonA').focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    assert.notEqual(await page.locator('#comparisonA').inputValue(), await page.locator('#comparisonB').inputValue());
    assert.equal(errors.length, 0, errors.join('\n'));
    console.log('PASS: genuine Chromium comparison, dynamic change, URL, invalid/duplicate, tabs, report cards, mobile and keyboard smoke');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
