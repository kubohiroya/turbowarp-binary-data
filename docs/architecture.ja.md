# アーキテクチャ

[English](architecture.md)

## data ownership

`BinaryDataStore`がproject sessionのbindingを所有します。登録時は`ArrayBuffer`／`Uint8Array`を必ずcopyし、size上限を検証し、SHA-256を計算してからbindingをatomicに置換します。保存bytesをbase64や文字列へ変換しません。

各bindingはbytes、MIME type、byte length、digest、opaque revisionを持ちます。`snapshot()`とraw body openは毎回独立したbyte copyを返します。

## Named Data provider

canonicalな`@kubohiroya/turbowarp-named-data`契約を直接実装し、runtime共通registryへpersistent登録します。

- namespace `binary`、kind `binary`、scope `project`
- representationは`raw`のみ
- replayableな`Uint8Array` body
- 安定した`NAMED_DATA_*` error
- abort検査と冪等なhandle release

相互運用fixtureは`tests/fixtures/named-data-provider-contract.json`です。

## lifecycleと段階導入

`BINARY_DATA_MVP`はextension構築時に一度だけ読み、既定値はfalseです。flag OFFではblockとproviderを公開しません。`PROJECT_STOP_ALL`ではprovider登録を維持したままbindingと追跡中handleを解放します。bytesの永続化はMVP対象外です。

## build artifact

sourceとblock definitionから`dist/binary-data.js`と`dist/extension-manifest.json`を生成します。両方をrelease artifactとしてcommitし、`pnpm run check`で再現性を検査します。
