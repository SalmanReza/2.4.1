import test from 'node:test';
import assert from 'node:assert/strict';
import { APP_VERSION } from '../src/branding.js';
import { recordedRakahs, prayerParts } from '../src/prayer-layers.js';
import { plateNumeralMarkup } from '../src/astrolabe-view.js';
import { readText } from './helpers/read-text.js';

const app = readText('../src/app.js', import.meta.url);
const html = readText('../index.html', import.meta.url);
const css = readText('../src/styles.css', import.meta.url);

test('v2.4.1 version', () => {
  assert.equal(APP_VERSION, '2.4.1');
});

test('daily record totals recorded rak‘ahs', () => {
  const monday = new Date(2026, 10, 16);
  const totals = recordedRakahs({
    fard: { fajr: true, dhuhr: true },
    sunnah: { fajr_before: true, dhuhr_before: true },
    nafl: { dhuhr_nafl: true },
    voluntary: { duha: true },
    rakahs: { duha: 4 }
  }, monday);
  assert.equal(totals.fard, 6);
  assert.equal(totals.sunnah, 6);
  assert.equal(totals.nafl, 2);
  assert.equal(totals.voluntary, 4);
  assert.equal(totals.total, 18);
  assert.match(app, /rakah-total-card/);
  assert.match(css, /\.rakah-total-card \{/);
});

test('before-begins reminders include voluntary prayers', () => {
  assert.match(app, /\[\.\.\.FARD, \.\.\.REMINDER_VOLUNTARY\]\.filter\(item => reminderRowVisible/);
  assert.match(html, /including voluntary prayers/);
  const start = app.indexOf('// Reminders before each obligatory or voluntary prayer begins');
  const end = app.indexOf('// Preferred-time reminders (two independent kinds)');
  assert.ok(start > 0 && end > start);
  assert.doesNotMatch(app.slice(start, end), /event\.kind !== 'fard'/);
});

test('a prohibited window replaces “remaining in this prayer”', () => {
  assert.match(app, /Remaining in prohibited time/);
  assert.match(app, /function timeCountdownTarget/);
  assert.match(app, /count\.dataset\.mode !== target\.mode/);
});

test('astrolabe numerals are not hidden by the rete or the bezel', () => {
  assert.match(html, /id="avPlateNums"/);
  assert.match(app, /avPlateNums/);
  const nums = plateNumeralMarkup(23.81, 'en');
  assert.match(nums, /10°/);
  assert.match(nums, />N</);
  assert.match(css, /\.av-dnum \{[^}]*fill: #f7fafc/);
});

test('home event rak‘ah row includes Fard and the description shows the same order', () => {
  assert.match(app, /includeFard: true/);
  assert.deepEqual(prayerParts('dhuhr').map(part => part.layer), ['sunnah', 'fard', 'sunnah', 'nafl']);
  assert.match(app, /function partLegendHtml/);
  assert.match(app, /class="live-guide"/);
  assert.doesNotMatch(css, /\.home-board \.live-rakah \{ display: none; \}/);
});
