/*
 * op-page-builder: tests
 * Date: 2026-11-14
 * Copyright (c) 2026 Operator Pages LLC. All rights reserved.
 * Proprietary and confidential. No license is granted.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { generatePage } from '../src/lib/generator.js';
import { validateHtml } from '../src/lib/validator.js';

test('vaultmax draft passes and does not invent a briefing link or a certification', () => {
  const form = JSON.parse(readFileSync(new URL('../examples/vaultmax.json', import.meta.url), 'utf8'));
  const html = generatePage(form, { date: '2026-11-14' });
  const report = validateHtml(html);
  assert.equal(report.ok, true);
  assert.deepEqual(report.warnings, ['No call-to-action link found']);
  assert.match(html, /No single node holds the key/);
  assert.doesNotMatch(html, /FIPS|FedRAMP|ITAR|mil-spec|Max Headroom|\$3\.2B/i);
  assert.equal((html.match(/<li>/g) ?? []).length, 6);
});
