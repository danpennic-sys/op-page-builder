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
import { claimFindings } from '../src/lib/claims.js';

const suite = JSON.parse(readFileSync(new URL('../examples/suite.json', import.meta.url), 'utf8'));

test('each suite page passes and carries no blocked claim', () => {
  assert.equal(suite.length, 5);
  for (const product of suite) {
    const html = generatePage(product.form, { date: '2026-11-14' });
    const report = validateHtml(html);
    const findings = claimFindings(Object.values(product.form).join('\n'));
    assert.equal(report.ok, true, product.id);
    assert.deepEqual(findings, [], product.id);
  }
});

test('slogans and certifications are blocked', () => {
  const findings = claimFindings('mil-spec FIPS certified the only Max Headroom $3.2B FedRAMP ITAR');
  assert.ok(findings.length >= 6);
});

test('FIPS may be named only to deny a certificate', () => {
  assert.deepEqual(claimFindings('FIPS work is not a certificate'), []);
});
