# Architecture

[日本語](architecture.ja.md)

## Data ownership

`BinaryDataStore` owns project-session bindings. Registration always copies an `ArrayBuffer` or `Uint8Array`, validates the configured size limit, computes SHA-256, then atomically replaces the binding. Stored bytes are never represented as base64 or text.

Each binding contains bytes, MIME type, byte length, digest, and an opaque monotonically changing revision. Every `snapshot()` and raw body open returns an independent byte copy.

## Named Data provider

The provider directly implements the canonical `@kubohiroya/turbowarp-named-data` contract and registers persistently in its runtime-shared registry:

- namespace `binary`, kind `binary`, scope `project`;
- representation `raw` only;
- replayable `Uint8Array` body;
- stable `NAMED_DATA_*` errors;
- abort checks and idempotent handle release.

The interoperability fixture is `tests/fixtures/named-data-provider-contract.json`.

## Lifecycle and rollout

`BINARY_DATA_MVP` is read once when the extension is constructed and defaults to false. With the flag off, no blocks or provider are exposed. `PROJECT_STOP_ALL` clears bindings and tracked handles while retaining the provider registration. Persistent byte storage is intentionally outside the MVP.

## Build outputs

Source and block definitions generate `dist/binary-data.js` and `dist/extension-manifest.json`. Both are checked release artifacts verified by `pnpm run check`.
