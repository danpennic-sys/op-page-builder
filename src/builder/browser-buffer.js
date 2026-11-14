/*
 * op-page-builder: browser stand-in for Buffer.byteLength
 * Date: 2026-11-14
 * Copyright (c) 2026 Operator Pages LLC. All rights reserved.
 * Proprietary and confidential. No license is granted.
 */

if (typeof globalThis.Buffer === "undefined") {
  Object.assign(globalThis, {
    Buffer: {
      byteLength(value) {
        return new TextEncoder().encode(value).length;
      },
    },
  });
}
