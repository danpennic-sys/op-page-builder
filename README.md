# op-page-builder

Local, offline landing page generator. No API keys. No network. No publication.

Operator approval is required before export. Export is not publication.

## Library

- `src/lib/generator.js` writes one standalone HTML page.
- `src/lib/validator.js` is a regex guardrail on that output, not a security audit.
- `npm test`

## Builder

`src/builder/App.jsx` is the mobile form and preview. It calls the same generator and validator. Download and copy stay locked until the operator approves that exact HTML.

## One desk

`examples/suite.json` is the record read from the public repos on 2026-11-14. Five products. Each page states the mechanism only. `src/lib/claims.js` blocks mil-spec, FedRAMP, ITAR, a certification, “the only,” and an unsourced market figure. FIPS may be named only to say it is not a certificate.

The desk is not a second verifier and it does not run the field sealers.
