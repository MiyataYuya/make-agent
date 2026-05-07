# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクトの位置づけ

AIエージェントを段階的に自作するための学習用リポジトリ。`chapters/` 配下に章ごとの実装スニペットを置き、各ステップを単独で `bun run` して動作を確認する構成（README にある「nano-code」が内部名）。`src/` は将来的な統合実装用の空フォルダ、`index.ts` はテンプレートのままのプレースホルダ。

## 実行環境の前提

- ランタイムは **Bun 1.3**（TypeScript はトランスパイル不要、`.ts` をそのまま実行）。`tsconfig.json` は `noEmit: true` で型チェック専用。
- 推奨は `.devcontainer/` の DevContainer 起動。コンテナ内 workspace は `/nano-code`。`postCreateCommand` で自動的に `bun install` が走る。
- **エージェントは Ollama の `gemma4` モデルを `http://host.docker.internal:11434/api/chat` 経由で呼ぶ前提**（`chapters/02-simple-call.ts` 参照）。DevContainer 内から実行する場合、ホスト側で Ollama デーモンが動いていてポート 11434 で待ち受けている必要がある。ホスト直接実行なら URL を `localhost` に書き換える必要がある。

## よく使うコマンド

```bash
bun install                         # 依存解決
bun run chapters/02-simple-call.ts  # 章ごとのスクリプトを実行（ファイル名を差し替え）
bun run index.ts                    # 現状はプレースホルダ
bunx tsc --noEmit                   # 型チェックのみ（noEmit 設定済み）
```

テストランナーとリンタは未導入。追加する場合は Bun 組み込みの `bun test` を優先候補にする。

## 章を増やすときの規約

- `chapters/NN-<topic>.ts` の命名で連番。各ファイルは単独実行できる完結したスクリプトにする（共有モジュール化したくなったら `src/` に切り出す）。
- TypeScript の strict / `noUncheckedIndexedAccess` が有効なので、配列・オブジェクトアクセスの undefined を必ず捌く。
- LLM レスポンスの JSON 形は `as { ... }` で narrowing する既存スタイル（`chapters/02-simple-call.ts:17`）に揃える。
