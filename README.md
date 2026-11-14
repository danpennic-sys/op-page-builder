# op-page-builder

Local, offline landing page generator. No API keys. No network. No publication.

Operator approval is required before export. Export is not publication.

## Library

- `src/lib/generator.js` writes one standalone HTML page.
- `src/lib/validator.js` is a regex guardrail on that output, not a security audit.
- `npm test`

## Builder

`src/builder/App.jsx` is the mobile form and preview. It calls the same generator and validator. Download and copy stay locked until the operator approves that exact HTML.

## VaultMax draft

`examples/vaultmax.json` is the current starter. It states the mechanism only. It does not claim a certification, a buyer, or a market size. The briefing link is empty until a real address is added.
