# TurboWarp-Binary-Data

[English](README.md)

project scopeの名前付きバイナリ値と、再利用可能なraw body snapshotを提供するTurboWarp拡張機能です。

## できること

- `ArrayBuffer`／`Uint8Array`をcopy-inでatomic登録
- UTF-8文字列からbinaryを作るTurboWarpブロック
- MIME type、byte length、SHA-256、opaque revisionの取得
- 共通Named Data provider契約によるraw body snapshot
- project停止時のsession data解放

base64、data URL、JavaScript文字列はcanonical storageとして使用しません。

## 有効化と安全性

MVPは既定OFFです。拡張機能の読み込み前に次を設定します。

```js
globalThis.BINARY_DATA_MVP = true;
```

unsandboxed extensionとして動作し、1値あたりの既定上限は16 MiBです。信頼できる生成済みコードだけを読み込んでください。

## JavaScript API

`registerBytes(name, bytes, options)`は入力をcopy-inし、size、MIME type、abort、SHA-256を検証してから登録します。`snapshot(name)`は独立した`Uint8Array`を返します。

`getNamedDataProvider()`はcanonicalな`@kubohiroya/turbowarp-named-data`契約を使用し、`binary` namespace、`binary` kind、`project` scope、`raw` representationに対応します。providerはruntime共通registryへpersistent登録されます。

## ブロック

- `store UTF-8 [TEXT] as binary [NAME] with MIME [MIME]`
- `binary [NAME] exists?`
- `delete binary [NAME]`
- `MIME type of binary [NAME]`
- `byte length of binary [NAME]`
- `SHA-256 of binary [NAME]`

## lifecycleとHTTP連携

open済みbodyは一貫したsnapshotです。同じ名前を置換するとrevisionは変わりますが、以前のsnapshotは変化しません。handleの`release()`は冪等です。`PROJECT_STOP_ALL`でbindingと追跡中handleを解放します。

共通fixtureは`tests/fixtures/named-data-provider-contract.json`です。詳細は[アーキテクチャ文書](docs/architecture.ja.md)を参照してください。

## 開発

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm run check
```

生成される拡張機能は`dist/binary-data.js`です。

## ライセンス

SPDX-License-Identifier: MPL-2.0
