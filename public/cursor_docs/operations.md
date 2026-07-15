# 運用手順書

共有家計簿アプリの日常運用・初回セットアップ・トラブル対応の手順です。  
デプロイ全般は [deploy.md](./deploy.md) も参照してください。

---

## 1. システムの構成

| 役割 | サービス |
| :--- | :--- |
| Web アプリ | Vercel（Next.js） |
| ログイン | Firebase Authentication（メール/パスワード・Google） |
| データ | Cloud Firestore |
| アクセス制限 | Firestore の許可リスト（`allowedEmails`） |
| 管理者 | Firestore の `config/app.adminEmails` |

**ポイント:** 誰でもログインできるわけではありません。許可リストに入ったメールだけが使えます。

---

## 2. 初回セットアップ（必須）

初めて本番を使うとき、または Auth ユーザーを作り直したあとに実施します。

### 2.1 Firestore ルールをデプロイ

ローカルで PowerShell を開き:

```powershell
cd E:\projects\dev\家計簿
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules --project expenses-f762b
```

> Windows では `firebase` 単体が入っていないことが多いです。  
> その場合は必ず `npx firebase-tools` を使います。

成功後、Firebase Console → **Firestore → ルール** に  
`allowedEmails` / `isAllowlisted` などの記述があることを確認します。

### 2.2 管理者メールを登録（Console）

Firebase Console → **Firestore** → コレクションを追加

**コレクション ID:** `config`  
**ドキュメント ID:** `app`

| フィールド | 型 | 値 |
| :--- | :--- | :--- |
| `adminEmails` | array（string） | `["あなた@example.com"]` **※すべて小文字** |

### 2.3 自分を許可リストに追加（Console）

**コレクション ID:** `allowedEmails`  
**ドキュメント ID:** `あなた@example.com`（**小文字のメールそのもの**）

| フィールド | 型 | 値 |
| :--- | :--- | :--- |
| `email` | string | `あなた@example.com` |
| `createdBy` | string | `bootstrap` |

### 2.4 ログインして動作確認

1. 本番 URL または `npm run dev` でアプリを開く
2. 登録したメールでログイン（Google 可）
3. 上部ナビに **「管理」** が出ること
4. グループを作成し、招待コードが表示されること

---

## 3. 日常の運用

### 3.1 新しい人を招待する（管理者）

1. 管理者アカウントでログイン
2. 上部ナビ **「管理」** を開く
3. **許可メールを追加** に相手のメールを入力して追加
4. 相手に次を伝える
   - アプリの URL
   - 使うメールアドレス（Google ならその Google アカウント）
   - （グループ作成後）招待コード

5. 相手がログイン → グループ未参加なら「参加」で招待コードを入力

### 3.2 家計グループ（2人）の作成

| 役割 | 操作 |
| :--- | :--- |
| 1人目 | ログイン → **新規作成** → 表示名 → グループ作成 → **招待コードを控える** |
| 2人目 | 許可リスト追加済みでログイン → **参加** → 表示名 + 招待コード |

グループは最大2人です。満員の招待コードでは参加できません。

### 3.3 許可を取り消す（管理者）

1. **管理** 画面の許可リストから対象を **削除**
2. 以降そのメールではログイン直後に拒否されます  
   （Firebase Auth のアカウント自体は残ります）

### 3.4 ログインユーザーの確認

**管理** 画面の「ログインしたユーザー」で次を確認できます。

- メールアドレス
- 表示名
- 最終ログイン日時

Google 認証でもメールはここに残ります。

### 3.5 表示名・パスワード

| 内容 | 方法 |
| :--- | :--- |
| 家計簿上の表示名 | 各画面ヘッダーの「（変更）」 |
| パスワード忘れ | ログイン画面「パスワードを忘れた」（メール入力後） |
| Google 利用者 | パスワード不要。「Google でログイン」を使う |

---

## 4. アプリの更新・再デプロイ

### 4.1 アプリ（Vercel）

1. 変更を GitHub に push  
2. Vercel が自動デプロイ（接続済みの場合）
3. 環境変数を変えた場合は **Redeploy** が必要

必要な環境変数（Vercel）:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

### 4.2 Firestore ルールだけ更新

```powershell
cd E:\projects\dev\家計簿
npx firebase-tools deploy --only firestore:rules --project expenses-f762b
```

アプリの push とは別に、**ルールは必ずこのコマンドでデプロイ**します。

### 4.3 承認済みドメイン

本番 URL を変えた・追加したとき:

Firebase Console → **Authentication → Settings → Authorized domains**  
に Vercel のドメイン（例: `xxxx.vercel.app`）を追加。

---

## 5. グループの作り直し

Auth ユーザーを削除した・作り直した場合、**UID が変わる**ため古いグループには入れません。

### 手順

1. （任意）Firestore の古い `groups/{id}` を削除  
   - 子の `expenses` も削除
2. 許可リストにメールがあることを確認
3. アプリでログイン
4. **新規作成** でグループを作り直す
5. 相手を招待コードで参加させる

古い `groups` の `members` を手で UID 書き換えするのは推奨しません。

---

## 6. ユーザー（Auth）の削除と再登録

### 削除したあと再度同じメールで使う場合

1. Authentication → Users から削除済みか確認
2. アプリでは **「ログイン」ではなく「新規登録」**（または Google）
3. `allowedEmails` にそのメールが残っているか確認（無いと入れない）
4. グループは **作り直す**（セクション 5）

### よくある間違い

| 状況 | 対処 |
| :--- | :--- |
| 削除後に「ログイン」した | 新規登録する |
| 許可リストが無い | Console か管理画面で追加 |
| ルール未デプロイ | セクション 2.1 を実施 |

---

## 7. Firestore データ一覧（運用で触るもの）

| パス | 用途 | 誰が触るか |
| :--- | :--- | :--- |
| `config/app` | 管理者メール一覧 | Console（初回・管理者変更時） |
| `allowedEmails/{email}` | ログイン許可 | 管理画面 or Console |
| `users/{uid}` | ログイン履歴（自動作成） | 通常は触らない |
| `groups/{id}` | 家計グループ | アプリが自動作成 |
| `groups/{id}/expenses/{id}` | 支出明細 | アプリが自動作成 |

メール関連のドキュメント ID は **必ず小文字** にしてください。

---

## 8. 管理者の追加・変更

1. Firestore `config/app` の `adminEmails` 配列にメールを追加（小文字）
2. そのメールを `allowedEmails` にも入れる
3. その人でログイン → 「管理」タブが出れば成功

`config/app` はアプリからは編集できません（Console のみ）。

---

## 9. トラブルシューティング

| 症状 | 確認・対処 |
| :--- | :--- |
| Firebase の環境変数が未設定 | Vercel の Environment Variables を設定し Redeploy |
| 「許可されていません」 | `allowedEmails` に小文字メールがあるか |
| 「アクセス確認に失敗」「permission-denied」 | ルール未デプロイのことが多い → セクション 2.1 |
| `firebase` が認識されない | `npx firebase-tools` を使う |
| ログイン後にグループ設定ばかり出る | まだグループ未作成、または旧 UID のグループが残っている |
| Google ログイン失敗 | Authorized domains に本番 URL があるか |
| パスワードが分からない | 「パスワードを忘れた」または Google ログイン |
| 同じメールで再登録できない | Auth に残っていないか確認。残っていなければ新規登録 |

---

## 10. 運用チェックリスト（定期）

- [ ] 許可リストに不要なメールが残っていないか
- [ ] 管理者メール（`config/app`）は正しいか
- [ ] Firestore ルールは最新コードと一致しているか
- [ ] Vercel の環境変数が欠けていないか
- [ ] 本番でログイン〜支出入力〜精算表示ができるか

---

## 関連ドキュメント

| ファイル | 内容 |
| :--- | :--- |
| [deploy.md](./deploy.md) | 初回の Firebase / Vercel 構築 |
| [spec/feature.md](./spec/feature.md) | 機能仕様 |
| [spec/logic.md](./spec/logic.md) | 精算ロジック |
| `firestore.rules` | セキュリティルール本体 |
| `.env.example` | 環境変数テンプレート |
