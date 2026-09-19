# TurboWarp-Binary-Data

[日本語](README.ja.md)

A TurboWarp extension for project-scoped named binary values and replayable raw body snapshots.

## What it does

- stores `ArrayBuffer` and `Uint8Array` values with copy-in semantics;
- creates binary values from UTF-8 text blocks;
- exposes MIME type, byte length, SHA-256 digest, and opaque revision metadata;
- supplies independent raw snapshots through the shared Named Data provider contract;
- clears session values when the project stops.

Binary bytes remain bytes. Base64, data URLs, and JavaScript strings are not canonical storage formats.

## Requirements and safety

- Node.js 22 or newer for development;
- TurboWarp unsandboxed extension mode;
- an explicit startup flag, `globalThis.BINARY_DATA_MVP = true`, because the MVP is disabled by default;
- a default per-value limit of 16 MiB.

Only load generated extension code that you trust. Unsandboxed extensions run with browser page access.

## Installation

```bash
pnpm add @kubohiroya/turbowarp-binary-data@0.1.0
```

For local development:

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm run check
```

The generated TurboWarp extension is `dist/binary-data.js`.

## JavaScript API

`BinaryDataExtension.registerBytes(name, bytes, options)` atomically copies bytes into the project registry after validating size, MIME type, abort state, and SHA-256. `snapshot(name)` returns a new `Uint8Array`; mutating it never changes the stored value.

`getNamedDataProvider()` exposes the canonical `@kubohiroya/turbowarp-named-data` provider contract while the feature flag is enabled. It accepts only `{namespace: "binary", kind: "binary", scope: "project"}` references with the `raw` representation. The provider is registered persistently in the runtime-shared registry.

## Block reference

<!-- BEGIN GENERATED BLOCKS -->

### `store UTF-8 [TEXT] as binary [NAME] with MIME [MIME]`

Copies UTF-8 encoded text into a project-scoped named binary value.

| Property | Value |
|---|---|
| Type | Command |
| Opcode | `createUtf8` |
| `TEXT` | String, default: `Hello` |
| `NAME` | String, default: `message` |
| `MIME` | String, default: `text/plain; charset=utf-8` |

### `binary [NAME] exists?`

Reports whether a project-scoped named binary value exists.

| Property | Value |
|---|---|
| Type | Boolean |
| Opcode | `hasBinary` |
| `NAME` | String, default: `message` |

### `delete binary [NAME]`

Deletes a project-scoped named binary value.

| Property | Value |
|---|---|
| Type | Command |
| Opcode | `deleteBinary` |
| `NAME` | String, default: `message` |

### `MIME type of binary [NAME]`

Returns the MIME type of a named binary value.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `mimeType` |
| `NAME` | String, default: `message` |

### `byte length of binary [NAME]`

Returns the byte length of a named binary value.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `byteLength` |
| `NAME` | String, default: `message` |

### `SHA-256 of binary [NAME]`

Returns the SHA-256 digest of a named binary value.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `sha256` |
| `NAME` | String, default: `message` |

<!-- END GENERATED BLOCKS -->

## Lifecycle and HTTP integration

An opened raw body is a consistent snapshot. Replacing the same name changes its opaque revision without changing earlier snapshots. Handles have idempotent `release()` methods. `PROJECT_STOP_ALL` clears project bindings and tracked handles.

The cross-repository fixture is in `tests/fixtures/named-data-provider-contract.json`. See [the architecture document](docs/architecture.md) for contract details.

## Development

```bash
pnpm run check
```

This runs type checking, linting, tests, generated documentation validation, reproducible dist validation, repository policy checks, and an npm package dry run.

## License

SPDX-License-Identifier: MPL-2.0
