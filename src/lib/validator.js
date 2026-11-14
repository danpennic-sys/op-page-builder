/*
 * op-page-builder: HTML checks
 * Date: 2026-11-13
 * Copyright (c) 2026 Operator Pages LLC. All rights reserved.
 * Proprietary and confidential. No license is granted.
 *
 * Regex-based checks for the pages this tool generates. This is a guardrail,
 * not a full HTML parser or a security audit.
 */

const MAX_BYTES = 200 * 1024;

/** @param {unknown} html */
export function validateHtml(html) {
  const errors = [];
  const warnings = [];
  const src = String(html ?? '');

  if (!/^\s*<!doctype html>/i.test(src)) errors.push('Missing <!DOCTYPE html>');
  if (!/<html[^>]*\slang=["'][a-z-]+["']/i.test(src)) errors.push('Missing lang attribute on <html>');
  if (!/<meta[^>]+charset=/i.test(src)) errors.push('Missing meta charset');
  if (!/<meta[^>]+name=["']viewport["']/i.test(src)) errors.push('Missing viewport meta tag');
  if (!/<title>\s*\S[\s\S]*?<\/title>/i.test(src)) errors.push('Missing or empty <title>');

  const h1s = src.match(/<h1[\s>]/gi) ?? [];
  if (h1s.length !== 1) errors.push(`Expected exactly one <h1>, found ${h1s.length}`);

  if (/<script[\s>]/i.test(src)) errors.push('Contains <script>; generated pages must be script-free');
  if (/<(iframe|object|embed|form)[\s>]/i.test(src)) errors.push('Contains iframe, object, embed or form');
  if (/<[^>]*\son[a-z]+\s*=/i.test(src)) errors.push('Contains inline event handler attribute');
  if (/<[^>]*\s(?:href|src|action)\s*=\s*["']?\s*(?:javascript|data|vbscript):/i.test(src)) {
    errors.push('Contains javascript:, data: or vbscript: URL');
  }
  if (/\{\{|\}\}|>(?:\s*)(?:undefined|\[object Object\])(?:\s*)</.test(src)) {
    errors.push('Contains unresolved placeholder or undefined value');
  }

  // External resource loading (links to other sites via <a> are fine).
  if (/<(img|link|source|video|audio)[^>]+(src|href)=["']?(https?:)?\/\//i.test(src)) {
    errors.push('Loads an external resource (img/link/source/video/audio)');
  }
  if (/@import|url\(\s*["']?(https?:)?\/\//i.test(src)) errors.push('CSS loads an external resource');

  for (const m of src.matchAll(/<img\b[^>]*>/gi)) {
    if (!/\salt=/i.test(m[0])) errors.push('Image without alt attribute');
  }
  for (const m of src.matchAll(/<a\b[^>]*target=["']_blank["'][^>]*>/gi)) {
    if (!/rel=["'][^"']*noopener/i.test(m[0])) errors.push('target=_blank link without rel=noopener');
  }
  for (const m of src.matchAll(/<a\b[^>]*href=["']([^"']*)["']/gi)) {
    if (!/^(https?:|mailto:|#)/i.test(m[1])) errors.push(`Link with disallowed URL: ${m[1].slice(0, 40)}`);
  }

  const bytes = Buffer.byteLength(src, 'utf8');
  if (bytes > MAX_BYTES) errors.push(`File is ${bytes} bytes; limit is ${MAX_BYTES}`);
  if (!/<a\b[^>]*class=["'][^"']*cta/i.test(src)) warnings.push('No call-to-action link found');

  return { ok: errors.length === 0, errors, warnings, bytes };
}
