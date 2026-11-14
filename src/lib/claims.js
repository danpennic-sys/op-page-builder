/*
 * op-page-builder: claim gate
 * Date: 2026-11-14
 * Copyright (c) 2026 Operator Pages LLC. All rights reserved.
 * Proprietary and confidential. No license is granted.
 */

export function claimFindings(text) {
  const found = [];
  if (/mil-?spec/i.test(text)) found.push('mil-spec is not a certification in the record.');
  if (/fedramp/i.test(text)) found.push('FedRAMP is not in the record.');
  if (/\bitar\b/i.test(text)) found.push('ITAR is not in the record.');
  if (/max headroom/i.test(text)) found.push('Max Headroom is not your name to use.');
  if (/\bthe only\b/i.test(text)) found.push('“The only” is a slogan, not evidence.');
  if (/\$\s*3\.2\s*b/i.test(text)) found.push('The $3.2B figure has no source in the record.');
  if (/certified/i.test(text)) found.push('Nothing in this suite is certified.');
  if (/fips/i.test(text) && !/not a certificate/i.test(text)) {
    found.push('Say FIPS only to mark that it is not a certificate.');
  }
  return found;
}
