# デプロイ手順書

共有家計簿アプリを本番環境（Vercel + Firebase）へ公開する手順です。  
機能仕様は [spec/feature.md](./spec/feature.md)、  
日常運用・ユーザー管理は [operations.md](./operations.md) を参照してください。

---

## 前提

| 項目 | 内容 |
| :--- | :--- |
| Node.js | v20 以上推奨 |
| アカウント | [Firebase](https://console.firebase.google.com)、[Vercel](https://vercel.com)、（任意）[GitHub](https://github.com) |
| ローカル確認 | `npm run dev` でログイン〜入力〜精算表示まで動作していること |

---

## 1. Firebase プロジェクトの作成

1. [Firebase Console](https://console.firebase.google.com) で「プロジェクトを追加」
2. プロジェクト名を入力（例: `shared-kakeibo`）して作成
3. Google Analytics は任意（オフでも可）

### 1.1 Authentication の有効化

1. 左メニュー **Build → Authentication → Get started**
2. **Sign-in method** タブで以下を有効化
   - **メール/パスワード** … 有効にする

### 1.2 Cloud Firestore の作成

1. 左メニュー **Build → Firestore Database → データベースの作成**
2. **本番環境モード** を選択（後で Rules をデプロイします）
3. リージョンは `asia-northeast1`（東京）推奨

### 1.3 Web アプリの登録

1. プロジェクトの概要 → **ウェブアプリを追加**（`</>` アイコン）
2. アプリのニックネームを入力して登録
3. 表示される Firebase 設定オブジェクトの値を控える

```javascript
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

---

## 2. ローカル環境変数の設定

プロジェクトルートで `.env.example` を `.env.local` にコピーし、値を入力します。

```bash
cp .env.example .env.local   # Windows: copy .env.example .env.local
```

| 変数名 | 設定値 |
| :--- | :--- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase 設定の `apiKey` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `projectId` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `appId` |

> `.env.local` は Git にコミットしないでください（`.gitignore` 済み）。

---

## 3. Firestore Security Rules のデプロイ

### 3.1 Firebase CLI のインストール（初回のみ）

```bash
npm install -g firebase-tools
firebase login
```

### 3.2 プロジェクトの紐付け

```bash
firebase use --add
```

表示された一覧から作成したプロジェクトを選択し、エイリアスは `default` のままで構いません。

### 3.3 Rules のデプロイ

リポジトリルートに `firestore.rules` と `firebase.json` があります。

```bash
firebase deploy --only firestore:rules
```

デプロイ後、Firebase Console の **Firestore → ルール** タブで内容が反映されていることを確認します。

---

## 4. ローカルでの最終確認

```bash
npm install
npm run dev
```

ブラウザで `http://localhost:3000` を開き、以下を確認します。

- [ ] ログイン画面が正しいサイズで表示される
- [ ] メール/パスワードで新規登録・ログインできる
- [ ] グループ作成 → 招待コードが表示される
- [ ] 2人目のアカウントで招待コード参加できる
- [ ] 支出入力 → ダッシュボードに精算が反映される
- [ ] 履歴画面に明細が表示される

---

## 5. Vercel へのデプロイ

### 5.1 リポジトリを GitHub にプッシュ

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

### 5.2 Vercel でインポート

1. [Vercel Dashboard](https://vercel.com/dashboard) → **Add New → Project**
2. GitHub リポジトリを選択してインポート
3. Framework Preset は **Next.js**（自動検出）
4. **Environment Variables** に `.env.local` と同じ 6 変数を追加

| Key | 適用環境 |
| :--- | :--- |
| `NEXT_PUBLIC_FIREBASE_*`（6件） | Production, Preview, Development すべて |

5. **Deploy** をクリック

### 5.3 デプロイ完了後

表示された URL（例: `https://shared-kakeibo.vercel.app`）にアクセスして動作確認します。

---

## 6. Firebase 側の本番ドメイン設定

### 6.1 Authentication の承認済みドメイン

1. Firebase Console → **Authentication → Settings → Authorized domains**
2. Vercel のドメイン（例: `shared-kakeibo.vercel.app`）が一覧にない場合は **Add domain** で追加

---

## 7. PWA（ホーム画面追加）の確認

1. スマホのブラウザで本番 URL を開く
2. **ホーム画面に追加**（iOS: 共有メニュー / Android: ブラウザメニュー）
3. 追加したアイコンから起動し、ログイン → 入力 → 精算表示まで確認

`public/manifest.json` と `public/icons/` がビルドに含まれます。

---

## 8. 本番チェックリスト

| # | 確認項目 |
| :---: | :--- |
| 1 | Vercel の環境変数 6 件がすべて設定されている |
| 2 | Firestore Rules が本番プロジェクトにデプロイ済み |
| 3 | Authentication の承認済みドメインに Vercel URL が含まれる |
| 4 | 2 アカウントでグループ参加〜支出共有ができる |
| 5 | スマホのホーム画面から起動できる |

---

## トラブルシューティング

| 症状 | 対処 |
| :--- | :--- |
| 画面が真っ白・極端に小さい | ブラウザのズームを 100% に戻す。`npm run dev` を再起動 |
| `Firebase config is missing` | `.env.local`（または Vercel 環境変数）を確認。変数名は `NEXT_PUBLIC_` プレフィックス必須 |
| ログイン後に権限エラー | `firebase deploy --only firestore:rules` を再実行 |
| 招待コードで参加できない | グループが既に 2 人で満員でないか、コードの大文字/小文字を確認 |

---

## 関連ファイル

| ファイル | 内容 |
| :--- | :--- |
| [spec/feature.md](./spec/feature.md) | 機能・DB 仕様 |
| [spec/logic.md](./spec/logic.md) | 精算アルゴリズム |
| [spec/directory.md](./spec/directory.md) | ディレクトリ構成 |
| `firestore.rules` | Firestore セキュリティルール |
| `.env.example` | 環境変数テンプレート |
