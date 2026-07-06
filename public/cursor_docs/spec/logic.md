# ロジック仕様（自動精算アルゴリズム）

Next.js（フロントエンド）側で集計・計算を行う際のアルゴリズムです。  
実装先: `src/features/expenses/settlement.ts`

**関連ドキュメント:** [feature.md](./feature.md)（機能要件・データ型）

---

## 前提条件

1. 対象月（例: 2025年5月）の支出データを取得する
2. **`isPending === false`（確定済み）のデータのみ**を計算対象とする
3. 未確定（`isPending === true`）のデータは合計・精算から除外する

---

## 計算手順

### Step 1: 各人の支払合計を算出

```
Total_kai   = Σ amount  （paidBy === 'kai'   の確定済み支出）
Total_miyuu = Σ amount  （paidBy === 'miyuu' の確定済み支出）
```

### Step 2: 全体合計と折半基準額を算出

```
Total_all = Total_kai + Total_miyuu
Target    = Math.floor(Total_all / 2)    // 1人あたりの負担額（50:50 折半・切り捨て）
```

### Step 3: 精算額（移動金）を決定

| 条件 | 精算の方向 | 精算額 |
| :--- | :--- | :--- |
| `Total_kai > Target` | みゆう → かい | `Math.floor(Total_kai - Target)` |
| `Total_miyuu > Target` | かい → みゆう | `Math.floor(Total_miyuu - Target)` |
| 上記以外（差額なし） | 精算不要 | `0` |

> `Total_kai === Target` かつ `Total_miyuu === Target` のとき、精算は不要です。

---

## 表示文言の生成

精算額が 0 より大きい場合、ダッシュボードに次の形式で表示します。

```
{支払う人} から {受け取る人} へ {精算額}円 の支払いが必要です
```

**例（5月分の実績を想定）**

| 項目 | 値 |
| :--- | ---: |
| Total_kai | 239,262円 |
| Total_miyuu | 137,341円 |
| Total_all | 376,603円 |
| Target | 188,301円（`Math.floor(376603 / 2)`） |
| 精算 | みゆう → かい へ **50,961円**（`Math.floor(239262 - 188301)`） |

---

## 実装時の注意

- **丸め:** 金額は整数（円）で扱い、`Target` と精算額はいずれも **`Math.floor`（切り捨て）** で統一する（`settlement.ts`）
- **月の境界:** `date` フィールド（`YYYY-MM-DD`）から対象月を判定する
- **リアルタイム更新:** Firestore のスナップショット購読により、データ変更時に再計算する
