[English](./docs/README.en.md) | [日本語](./docs/README.ja.md)

# takasumibot-toolkit

[TakasumiBOT 公開 API（v3）](https://api.takasumibot.com/docs) を利用する TypeScript クライアント SDK です。OpenAPI ドキュメントに定義された HTTP エンドポイントに対応しています。

- Node.js 22.12.0 以上（Bun でも利用可能）、グローバル `fetch` が必要
- ランタイム依存は `zod` のみ
- ESM / CommonJS と TypeScript 型定義に対応
- リトライ、タイムアウト、構造化エラー、任意のキャッシュを提供
- `int64` の値は `bigint` で扱い、精度を保持
- 公開 API のため認証不要。WebSocket (`/v3/realtime/`) は対象外

## インストール

```bash
npm install takasumibot-toolkit
```

## クイックスタート

```ts
import { createToolKit } from "takasumibot-toolkit";

const kit = createToolKit();

const tax = await kit.getTaxInfo();
const ranking = await kit.getRanking();
const profile = await kit.getProfileById("123456789012345678");

console.log(tax.incomeTaxRate); // number
console.log(profile.assets); // bigint
```

## 主な機能

### API クライアント

税率、シャード、統計、履歴、プロフィール、ランキング、企業、株価、Discord ユーザー、ステータスなどの情報を取得できます。利用可能なメソッドとパスは、同梱の `TakasumiBOT-OpenAPI-Document.json` に基づきます。

ギフトコードはリクエスト前に形式を検証します。

```ts
const gift = await kit.getGiftInfo("Abc123Xyz0");
```

### 株価ヘルパー

API から取得する株式一覧をもとに、銘柄情報・現在価格・履歴を取得できます。これらのヘルパーは追加の HTTP リクエストを行いません。履歴は**新しい順**で、価格がない場合 `price()` は `null` を返します。

```ts
const price = await kit.getStock().id("JTTI").price(); // bigint | null
const info = await kit.getStock().id("JTTI").info();
const history = await kit.getStock().id("JTTI").history({ limit: 3 });
```

株式一覧のキャッシュは既定で無効です。必要に応じてクライアント単位で有効化できます。

```ts
const kit = createToolKit({ stockCache: { ttlMs: 60_000 } });
```

### 設定とエラー処理

タイムアウト、共通ヘッダー、`fetch` 関数、ログ出力、リトライなどを設定できます。設定値が不正な場合は `TakasumiBotToolkitConfigError` が発生します。

```ts
const kit = createToolKit({
  timeoutMs: 10_000,
  retry: { maxRetries: 3 },
  headers: { "user-agent": "my-bot/1.0.0" },
});
```

ネットワークエラー、タイムアウト、HTTP `429` / `500` / `502` / `503` / `504` はリトライ対象です。その他の HTTP エラーや入力・レスポンスの検証エラーはリトライされません。エラーは `TakasumiBotToolkitError` を継承し、種類に応じて `status`、`code`、`retryable` などを参照できます。

### `bigint` とヘルパー

`int64` の値（資産、価格など）は `bigint` として返されます。大きな整数を JavaScript の安全な整数範囲に丸めず扱えます。

また、フィールドの選択・除外、Markdown テーブル生成、数値や日時の整形、ページネーション、株価履歴の整形などの純粋関数を、名前付きエクスポートまたは `kit.helpers` から利用できます。

## 開発用スクリプト

```bash
npm run build
npm test
npm run lint
npm run typecheck
npm run generate:types
```

## TakasumiBOT-OpenAPI-Document.json について
この SDK は、同梱の `TakasumiBOT-OpenAPI-Document.json` に基づき、HTTP エンドポイントを定義しています。
この OpenAPI ドキュメントは、[TakasumiBOT API](https://api.takasumibot.com/docs) から取得したものを SDK 用に情報を追加および整理したものです。SDK の更新に伴い、同梱の OpenAPI ドキュメントが更新される場合があります。
元の OpenAPI ドキュメントは TakasumiBOT API から取得できます。

## ライセンス

[MIT](./LICENSE)
同梱の `TakasumiBOT-OpenAPI-Document.json` は配布許可を得て同梱しています。
