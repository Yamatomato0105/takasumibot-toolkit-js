# takasumibot-toolkit

TakasumiBOT 公開 API（v3）向けの TypeScript クライアント SDK です。

- Strict TypeScript
- Node.js 22.12.0 以上（Bun でも動作）
- グローバル `fetch` を前提
- ランタイム依存は `zod` のみ
- ESM + CommonJS + `.d.ts` のビルド対応
- 指数バックオフによるリトライ、タイムアウト、構造化エラー、任意のキャッシュ
- `format: int64` の値はすべて `bigint` で扱い、精度損失なし
- 認証不要（API は公開）、WebSocket クライアントは非対応

このリポジトリに同梱されている OpenAPI ドキュメント（`TakasumiBOT-OpenAPI-Document.json`）が唯一の信頼元です。各メソッドは宣言された HTTP パスに対応し、それ以外の呼び出しは行いません。

> WebSocket エンドポイント `/v3/realtime/` は意図的に未実装です。

## インストール

```bash
npm install takasumibot-toolkit
# pnpm add takasumibot-toolkit
# yarn add takasumibot-toolkit
# bun add takasumibot-toolkit
```

Node.js 22.12.0 以上が必要です（グローバルな `fetch` 実装が必須）。

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

すべての機能は単一クライアントインスタンス経由でも利用できます。グローバル状態はなく、リクエストごと・プロセスごとにクライアントを作成して問題ありません。

## 設定 (`basicConfig`)

```ts
const kit = createToolKit({
  timeoutMs: 10_000,
  headers: { "user-agent": "my-bot/1.0.0" },
  retry: { maxRetries: 3, initialDelayMs: 300, maxDelayMs: 5_000, backoffFactor: 2, jitter: true },
  fetch: myCustomFetch, // defaults to globalThis.fetch
  logger: { warn: console.warn, error: console.error },
  stockCache: { ttlMs: 60_000 }, // disabled unless passed
});
```

| オプション | デフォルト | 備考 |
| --- | --- | --- |
| `timeoutMs` | `10000` | 各試行ごとのタイムアウト。有限の数値で `> 0` 必須 |
| `headers` | `{}` | すべてのリクエストにマージされ、SDK のデフォルトよりユーザー値が優先 |
| `retry` | 下記参照 | リトライ設定の部分オーバーライド |
| `fetch` | `globalThis.fetch` | 任意の `fetch` 互換関数（テストに便利） |
| `logger` | no-op | `{ debug?, info?, warn?, error? }` の各項目は任意 |
| `stockCache` | `false`（無効） | `false` または `{ ttlMs?: number }` |

リトライのデフォルト: `maxRetries: 3`, `initialDelayMs: 300`, `maxDelayMs: 5000`, `backoffFactor: 2`, `jitter: true`。

不正な設定は即座に `TakasumiBotToolkitConfigError` を throw します。
- `timeoutMs` が負
- `maxRetries` が整数でない
- `initialDelayMs > maxDelayMs`
- `stockCache.ttlMs <= 0`
などはすべて `TakasumiBotToolkitConfigError` になります。

### `baseUrl`

`basicConfig` に `baseUrl` はなく、`kit.baseUrl` は読み取り専用であり、プロパティの上書きはできません。

```ts
kit.baseUrl; // "https://api.takasumibot.com"
kit.baseUrl = "https://example.test"; // TypeError (strict mode)
```

解決順序:

1. `process.env.TAKASUMIBOT_BASE_URL`（Node.js / Bun のみ、空文字時は無視）
2. OpenAPI ドキュメントの `servers[0].url`（`https://api.takasumibot.com/`）

ベース URL とパスの両方から末尾のスラッシュは取り除かれます。そのためリクエスト先は `https://api.takasumibot.com/v3/tax` になります。

## エンドポイント

| メソッド | パス | 戻り値 |
| --- | --- | --- |
| `getGiftInfo(id)` | `/v3/gift/{id}` | `GiftResponse` |
| `getTaxInfo()` | `/v3/tax/` | `TaxResponse` |
| `getShardInfo()` | `/v3/shard/` | `ShardResponse` |
| `getStatisticsInfo()` | `/v3/statistics/` | `StatisticsResponse` |
| `getHistoryById(id)` | `/v3/history/{id}` | `HistoryEntry[]` |
| `getProfileById(id)` | `/v3/profile/{id}` | `ProfileResponse` |
| `getRanking()` | `/v3/ranking/` | `RankingEntry[]` |
| `getCompanyList()` | `/v3/companylist/` | `CompanyListEntry[]` |
| `getCompanyById(id)` | `/v3/company/{id}` | `CompanyDetailResponse` |
| `getStockList()` | `/v3/stock/` | `StockEntry[]` |
| `getDiscordUserByName(name)` | `/v3/discord/usersearch/{name}` | `DiscordUserSearchResponse` |
| `getCompanyHistoryById(id)` | `/v3/companyHistory/{id}` | `CompanyHistoryEntry[]` |
| `getStatus()` | `/v3/status/` | `StatusEntry[]` |

```ts
// Gift code は、リクエスト前にクライアント側で /^[A-Za-z0-9]{10}$/ で検証されます。
const gift = await kit.getGiftInfo("Abc123Xyz0");
```

> `/v3/realtime/` は WebSocket エンドポイントであり、このパッケージの対象外です。

## Stock

OpenAPI ドキュメントが公開しているのは stock の一覧取得だけ（`GET /v3/stock/`）であり、`info` / `price` / `history` はクライアント側で導出されます。追加の HTTP リクエストは発生しません。

`prices` は時間順に昇順で、最後の要素が最新価格ですが、この SDK が返す履歴は常に「新しい順」になっていることに注意してください。`price()` および `prices()[0]` は最新価格を返します。

```ts
const stocks = await kit.getStockList();

// Builder（遅延実行: 末端のメソッドを await するまで何も起きない）
const price = await kit.getStock().id("JTTI").price(); // bigint | null
const info = await kit.getStock().id("JTTI").info(); // StockEntry
const history = await kit.getStock().id("JTTI").history({ limit: 3 }); // [103n, 102n, 101n]

// 個別関数としての同等の利用法
await kit.getStockPriceById("JTTI");
await kit.getStockInfoById("JTTI");
await kit.getStockHistoryById("JTTI", { limit: 3 });
```

ルール:

- `price()` は最新価格を返し、`prices` が空なら `null` を返します（エラーではありません）。
- `history({ limit })`: `0` → `[]`、負数 / `NaN` / 整数でない値 → `TakasumiBotToolkitValidationError`、未指定 → 履歴全件を返し、新しい順。
- 不明な stock id は `TakasumiBotToolkitValidationError` (`code: "STOCK_NOT_FOUND"`) を throw します（再試行されません）。

### 互換性への配慮

OpenAPI ドキュメントでは `StockEntry.id` は 10 個の値の enum として宣言されていますが、レスポンス全体を検証します。厳密な `z.enum` を使うと、API が 11 番目の企業を追加した日に全体のバリデーションが失敗し、`getStockList()` とそれを基にした Stock ヘルパーが一斉に壊れてしまいます。
そのため enum は「空でない文字列」として検証されます（`looseEnum`）。型推論の結果は `StockId | (string & {})` になり、ドキュメントに載っているコードの補完は維持しつつ、新しい値でも型チェックを通せるようにしています。同じ考え方が `GiftResponse.type` と `GiftResponse.status` にも適用されています。

```ts
import { STOCK_IDS, isKnownValue } from "takasumibot-toolkit";

const stocks = await kit.getStockList();
const documented = stocks.filter((s) => isKnownValue(s.id, STOCK_IDS));
```

未知のキーは既に受け入れられており（`loose`）、同じギャップを未知の値についても埋めています。

### Stock キャッシュ

キャッシュはデフォルトで無効です。`getStockList()` は毎回リクエストを行います。クライアント単位で有効化できます。

```ts
const kit = createToolKit({ stockCache: {} }); // enabled, TTL 60 s
const other = createToolKit({ stockCache: { ttlMs: 30_000 } }); // enabled, TTL 30 s
const uncached = createToolKit({ stockCache: false }); // disabled (default)
```

- スコープ: クライアントインスタンス単位（同じキャッシュは 2 つのクライアントで共有されません）
- `getStockList()` とそれに依存する Stock ヘルパーに適用されます
- `ttlMs` は有限かつ `> 0` の数値でなければならず、条件を満たさない場合は `TakasumiBotToolkitConfigError` を throw します
- 同時に発生する miss は 1 つの in-flight リクエストとして共有されます (single-flight)

## エラー

すべてのエラークラスは `Error` を継承した `TakasumiBotToolkitError` を継承しており、元の `cause` を保持し、意味のある場合は `retryable` を公開します。

| クラス | 発生条件 | `retryable` |
| --- | --- | --- |
| `TakasumiBotToolkitError` | ベースクラス | `undefined` |
| `TakasumiBotToolkitConfigError` | 不正な `createToolKit` の設定 | `false` |
| `TakasumiBotToolkitValidationError` | 不正な引数、不正な `limit`、未知の stock id、不正な gift id | `false` |
| `TakasumiBotToolkitHttpError` | 2xx 以外のレスポンス（`status`, `code?`, `requestId?`, `rawBody?`） | `429` / `500` / `502` / `503` / `504` のとき `true` |
| `TakasumiBotToolkitNetworkError` | `fetch` が拒否 | `true` |
| `TakasumiBotToolkitTimeoutError` | リクエストが `timeoutMs` を超過 | `true` |
| `TakasumiBotToolkitRetryLimitError` | リトライが尽きた（`attempts`, `lastError`） | `false` |
| `TakasumiBotToolkitResponseParseError` | 2xx の本文が無効な JSON または `zod` の検証に失敗（`zodIssues`） | `false` |

```ts
import {
  TakasumiBotToolkitError,
  TakasumiBotToolkitHttpError,
  TakasumiBotToolkitValidationError,
} from "takasumibot-toolkit";

try {
  await kit.getGiftInfo("nope");
} catch (error) {
  if (error instanceof TakasumiBotToolkitValidationError) {
    console.error(error.field, error.code); // "id" "INVALID_GIFT_ID"
  } else if (error instanceof TakasumiBotToolkitHttpError) {
    console.error(error.status, error.requestId);
  } else if (error instanceof TakasumiBotToolkitError) {
    console.error(error.name, error.message, error.retryable);
  }
}
```

JSON ではない本文を含む非 2xx レスポンスは `rawBody` を保持したまま `TakasumiBotToolkitHttpError` を throw します。2xx のレスポンスだけが `TakasumiBotToolkitResponseParseError` を throw します。

## リトライ

リトライ対象:

- ネットワークエラー
- タイムアウト
- HTTP `429`, `500`, `502`, `503`, `504`

上記以外のエラーは即失敗します（その他の 4xx、検証、設定、パースエラーなど）。

```ts
const kit = createToolKit({ retry: { maxRetries: 0 } }); // disable retries
```

- 遅延: `min(initialDelayMs * backoffFactor ** attempt, maxDelayMs)` を計算し、`jitter` が `true` の場合は `[50%, 100%]` の範囲でジッターをかけます
- パース可能な `Retry-After` ヘッダーがあればバックオフより優先され、`maxDelayMs * 3` にクリップされます
- 各試行ごとに `timeoutMs` が適用され、グローバルな終了時刻はありません
- `maxRetries: 0` の場合、元のエラーがそのまま再送出されます。それ以外では、リトライが尽きると `lastError` を持つ `TakasumiBotToolkitRetryLimitError` が throw されます
- リトライとリタイアは `logger.warn` / `logger.error` を通じてログが記録されます

## bigint と JSON

この SDK は `response.json()` を使いません。`format: int64` の値（`amount`, `assets`, `prices`, `dividendAmount`, `idleTax` など）はすべて `bigint` として公開されます。

1. ボディを `response.text()` で読む
2. 小さなカスタム JSON スキャナーでパースし、整数リテラルが安全な整数範囲を超える場合は `bigint` に変換する
3. 結果を `zod` のスキーマで検証し、`int64` は `bigint`、`int32` は `number` に変換する
4. バリデーション失敗時は `TakasumiBotToolkitResponseParseError` を throw する

```ts
const profile = await kit.getProfileById("123456789012345678");
profile.assets; // 9007199254740993n — never 9007199254740992
```

## ヘルパー

副作用のない純粋関数です。名前付きエクスポートとして利用でき、`kit.helpers` からもアクセスできます。

```ts
import {
  truncate,
  pickFields,
  omitFields,
  toMarkdownTable,
  formatNumber,
  formatTimestamp,
  paginate,
  getRecentStockHistory,
} from "takasumibot-toolkit";

truncate("hello world", 8); // "hello..."（省略記号も長さに含まれる）
truncate("😀😀😀", 4); // "..." — 文字の分割を避け、孤立サロゲートを返さない
pickFields({ a: 1, b: 2, c: 3 }, ["a", "c"]); // { a: 1, c: 3 }
omitFields({ a: 1, b: 2, c: 3 }, ["b"]); // { a: 1, c: 3 }

toMarkdownTable([
  { name: "JTTI", price: 103n },
  { name: "KENTAI", price: null },
]);
// | name | price |
// | --- | --- |
// | JTTI | 103 |
// | KENTAI |  |

toMarkdownTable([{}]); // "" — 列がない場合は描画可能なテーブルを返さない

formatNumber(1234567n); // "1,234,567"（デフォルトは ja-JP）
formatTimestamp("2024-01-01T00:00:00Z"); // "2024-01-01T00:00:00.000Z"
formatTimestamp(Date.now(), { format: "relative" }); // "今" / "5 分前"（ja-JP）

paginate([1, 2, 3, 4, 5], 1, 2);
// { items: [1, 2], page: 1, pageSize: 2, totalItems: 5, totalPages: 3, hasNext: true, hasPrev: false }
paginate([1, 2, 3], 10, 2).items; // [] — 範囲外のページはエラーではなく空配列

getRecentStockHistory([100n, 101n, 102n, 103n], 2); // [103n, 102n]（history と同じルール）
```

`|` は `\|` にエスケープされ、改行は `<br>` に変換されます。`null` / `undefined` は空セルとして扱われます。
列のない行は、不正な 3 行テーブルではなく `""` として描画されます。
引数が不正な場合は `TakasumiBotToolkitValidationError` を throw します。

`truncate` は UTF-16 のコードユニット数を数えます。孤立サロゲートを UTF-8 でエンコードすると `U+FFFD` になり、Discord に送るのに不向きであるため、文字の途中で分割する場合、補助平面文字（絵文字など）を切り取るときは未ペアのサロゲートが削除されます。そのため、結果が `maxLength` より 1 文字短くなることがあります。

## 独自コードでのテスト

すべてのリクエストは `basicConfig.fetch` を経由するため、ネットワーク接続なしでも動作確認できます。

```ts
import { createToolKit } from "takasumibot-toolkit";
import { describe, expect, it } from "vitest";

const kit = createToolKit({
  fetch: async () => new Response(JSON.stringify([]), { status: 200 }),
  retry: { maxRetries: 0 },
});

it("returns an empty ranking", async () => {
  await expect(kit.getRanking()).resolves.toEqual([]);
});
```

## スクリプト

```bash
npm run build          # tsup: ESM + CJS + .d.ts
npm test               # vitest (no network)
npm run lint           # eslint
npm run typecheck      # tsc --noEmit
npm run generate:types # openapi-typescript -> src/generated/openapi.ts
```

## ライセンス

[MIT](../LICENSE) — `Copyright (c) 2026 Yamatomato`.
