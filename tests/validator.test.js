/*
 * op-page-builder: validator tests
 * Date: 2026-11-13
 * Copyright (c) 2026 Operator Pages LLC. All rights reserved.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { validateHtml } from '../src/lib/validator.js';

const base = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width"><title>T</title></head>
<body><h1>Hi</h1><a class="cta" href="https://example.com">Go</a></body></html>`;

const has = (html, re) => validateHtml(html).errors.some((e) => re.test(e));

test('minimal valid page passes', () => assert.equal(validateHtml(base).ok, true));
test('empty input fails', () => assert.equal(validateHtml('').ok, false));
test('missing doctype', () => assert.ok(has(base.replace('<!DOCTYPE html>', ''), /DOCTYPE/)));
test('missing lang', () => assert.ok(has(base.replace(' lang="en"', ''), /lang/)));
test('missing viewport', () => assert.ok(has(base.replace(/<meta name="viewport"[^>]*>/, ''), /viewport/)));
test('two h1s', () => assert.ok(has(base.replace('</body>', '<h1>x</h1></body>'), /exactly one <h1>/)));
test('script tag', () => assert.ok(has(base.replace('</body>', '<script>1</script></body>'), /script/)));
test('inline handler', () => assert.ok(has(base.replace('<h1>', '<h1 onclick="x()">'), /event handler/)));
test('javascript url', () => assert.ok(has(base.replace('https://example.com', 'javascript:x'), /javascript:/)));
test('external image', () => assert.ok(has(base.replace('</body>', '<img src="https://a.com/x.png" alt=""></body>'), /external/)));
test('image without alt', () => assert.ok(has(base.replace('</body>', '<img src="x.png"></body>'), /alt/)));
test('blank target without noopener', () => assert.ok(has(base.replace('class="cta"', 'class="cta" target="_blank"'), /noopener/)));
test('undefined leaked', () => assert.ok(has(base.replace('Hi', 'undefined'), /undefined/)));
test('missing CTA warns, not errors', () => {
  const r = validateHtml(base.replace(/<a[^>]*>Go<\/a>/, ''));
  assert.equal(r.ok, true);
  assert.equal(r.warnings.length, 1);
});
