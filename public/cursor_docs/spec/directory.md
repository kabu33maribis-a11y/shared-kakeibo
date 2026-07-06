# ディレクトリ構成

プロジェクトルートからの推奨ディレクトリ構成です。  
機能・データ仕様は [feature.md](./feature.md)、精算ロジックは [logic.md](./logic.md) を参照してください。

```
家計簿/                              # プロジェクトルート
├── src/
│   ├── app/                         # 【Routing】画面のページ構成（Next.js App Router）
│   │   ├── layout.tsx               # 全画面共通レイアウト（PWA 設定・フォントなど）
│   │   ├── page.tsx                 # ログイン画面、またはダッシュボードへのリダイレクト
│   │   ├── dashboard/               # ダッシュボード画面
│   │   │   └── page.tsx
│   │   ├── input/                   # 支出入力画面
│   │   │   └── page.tsx
│   │   └── history/                 # 明細一覧（履歴）画面
│   │       └── page.tsx
│   │
│   ├── components/                  # 【UI コンポーネント】画面を構成する部品
│   │   ├── ui/                      # shadcn/ui の共通コンポーネント（ボタン、入力欄など）
│   │   ├── dashboard/               # ダッシュボード専用（グラフ、精算ナビなど）
│   │   ├── input/                   # 入力画面専用（簡易テンキーなど）
│   │   └── history/                 # 履歴画面専用（月別タブ、明細カードなど）
│   │
│   ├── lib/                         # 【外部連携】Firebase などの設定・初期化
│   │   └── firebase.ts              # Firebase SDK 初期化（Auth, Firestore）
│   │
│   ├── features/                    # 【ビジネスロジック】Firebase とのデータ通信
│   │   ├── auth/                    # 認証関連のロジック・状態管理
│   │   └── expenses/                # 支出データ関連
│   │       ├── expense_service.ts   # Firestore への保存・取得・更新
│   │       └── settlement.ts        # 精算金額の計算（→ logic.md）
│   │
│   └── types/                       # 【型定義】データ構造
│       └── index.ts                 # Expense インターフェースなど
│
├── public/                          # PWA 用アイコン、manifest.json など
│   └── cursor_docs/
│       ├── deploy.md                # デプロイ手順書
│       └── spec/                    # 【Cursor 専用】AI 向け仕様書
│           ├── feature.md           # 機能・技術・DB 仕様
│           ├── logic.md             # 自動精算アルゴリズム
│           └── directory.md         # 本ファイル
│
├── tailwind.config.ts               # デザイン設定
└── tsconfig.json                    # TypeScript 設定
```

## レイヤーごとの責務

| ディレクトリ | 責務 |
| :--- | :--- |
| `src/app/` | ルーティングとページのエントリポイント。ビジネスロジックは書かない |
| `src/components/` | 表示専用の UI 部品。`features/` からデータを受け取って描画 |
| `src/features/` | Firestore 通信・精算計算・認証状態などのアプリ固有ロジック |
| `src/lib/` | サードパーティ SDK の初期化・共通ユーティリティ |
| `src/types/` | TypeScript 型定義（feature.md の `Expense` など） |
| `public/cursor_docs/spec/` | 開発用仕様書（本番ビルドには影響しない） |
