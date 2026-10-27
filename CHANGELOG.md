# CHANGELOG

## [0.1.0-beta.1] - 2026-10-27

### Breaking Changes

- `TakasumiBotToolKitResponseParseError` の `ZodIssue` の構造の変更:
  - 後述のセキュリティ対応により、`TakasumiBotToolKitResponseParseError` の `ZodIssue` の構造を Zod v4 に合わせて変更しました。
  - 一部のイシューを直接参照するエラーハンドリングが正しく動作しなくなるなどの影響が出る可能性があります。必要に応じてエラーハンドリングのコードを変更してください。

### Security

- [CVE-2023-54404](https://www.cve.org/CVERecord?id=CVE-2023-54404) に関する脆弱性対応:
  - 依存関係の脆弱性に対応するため、Zod を v4.6.6 にアップグレードしました。

## [0.1.0-beta.0] - 2026-10-18

### Added

- 初回ベータ版リリース（主要機能の追加）
