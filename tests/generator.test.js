/*
 * op-page-builder: tests
 * Date: 2026-11-13
 * Copyright (c) 2026 Operator Pages LLC. All rights reserved.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { generatePage, safeUrl, escapeHtml } from '../src/lib/generator.js';
import { validateHtml } from '../src/lib/validator.js';

const good = {
  businessName: 'Acme Machine Works',
  headline: 'Precision parts, on time',
  subheadline: 'Small-batch machining in Missouri',
  ctaText: 'Request a quote',
  ctaUrl: 'https://example.com/quote',
  features: 'CNC milling\nTurning\nFast turnaround',
  accentColor: '#aa3300',
};
const date = '2026-11-13';

test('valid form generates a page that passes validation', () => {
  const html = generatePage(good, { date });
  const r = validateHtml(html);
  assert.deepEqual(r.errors, []);
  assert.equal(r.ok, true);
  assert.match(html, /Acme Machine Works/);
  assert.match(html, /2026-11-13/);
});

test('output is deterministic for a fixed date', () => {
  assert.equal(generatePage(good, { date }), generatePage(good, { date }));
});

test('HTML in user input is escaped', () => {
  const html = generatePage({ ...good, headline: '<script>alert(1)</script>', businessName: 'A"B' }, { date });
  assert.doesNotMatch(html, /<script/i);
  assert.match(html, /&lt;script&gt;/);
  assert.equal(validateHtml(html).ok, true);
});

test('missing required fields are all reported', () => {
  assert.throws(() => generatePage({}, { date }), /businessName is required; headline is required/);
});

test('javascript: CTA URL is rejected', () => {
  assert.throws(() => generatePage({ ...good, ctaUrl: 'javascript:alert(1)' }, { date }), /ctaUrl/);
});

test('contact email can drive the CTA', () => {
  const html = generatePage({ ...good, ctaUrl: '', contactEmail: 'hi@example.com' }, { date });
  assert.match(html, /href="mailto:hi@example\.com"/);
});

test('invalid email is rejected', () => {
  assert.throws(() => generatePage({ ...good, ctaUrl: '', contactEmail: 'nope' }, { date }), /contactEmail/);
});

test('bad accent color falls back to default', () => {
  assert.match(generatePage({ ...good, accentColor: 'red;}</style>' }, { date }), /--accent: #c8691e/);
});

test('features capped at six', () => {
  const html = generatePage({ ...good, features: Array.from({ length: 10 }, (_, i) => `F${i}`) }, { date });
  assert.equal((html.match(/<li>/g) ?? []).length, 6);
});

test('safeUrl and escapeHtml basics', () => {
  assert.equal(safeUrl('ftp://x.com'), null);
  assert.equal(safeUrl('not a url'), null);
  assert.equal(escapeHtml(`<&"'>`), '&lt;&amp;&quot;&#39;&gt;');
});

test('handler words in visible text do not fail the guardrail', () => {
  const html = generatePage({ ...good, features: 'Call onload=desk' }, { date });
  assert.equal(validateHtml(html).ok, true);
});

test('javascript mentioned in copy is not treated as a link', () => {
  const html = generatePage({ ...good, headline: 'See href=javascript:alert(1)' }, { date });
  assert.equal(validateHtml(html).ok, true);
  assert.doesNotMatch(html, /href="javascript:/i);
});

test('the word undefined inside a sentence is allowed', () => {
  const html = generatePage({ ...good, subheadline: 'Scope is undefined until deposit' }, { date });
  assert.equal(validateHtml(html).ok, true);
});

test('mailto without an email is rejected', () => {
  assert.throws(() => generatePage({ ...good, ctaUrl: 'mailto:not an email' }, { date }), /ctaUrl/);
});

test('mailto with an email and subject is kept', () => {
  const html = generatePage({ ...good, ctaUrl: 'mailto:hi@example.com?subject=Hi' }, { date });
  assert.match(html, /href="mailto:hi@example\.com\?subject=Hi"/);
  assert.equal(validateHtml(html).ok, true);
});
