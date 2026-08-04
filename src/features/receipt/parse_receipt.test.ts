import {
  extractAmounts,
  extractStoreName,
  extractTotalAmount,
  parseReceiptText,
} from "@/features/receipt/parse_receipt";
import { describe, expect, it } from "vitest";

describe("extractAmounts", () => {
  it("parses yen symbols and commas", () => {
    expect(extractAmounts("合計 ¥1,236")).toEqual([1236]);
    expect(extractAmounts("1,980円")).toEqual([1980]);
  });

  it("parses full-width digits", () => {
    expect(extractAmounts("合計 ￥１，２３６")).toEqual([1236]);
  });
});

describe("extractTotalAmount", () => {
  it("prefers the total line over larger item amounts", () => {
    const text = `
セブンイレブン
サンドイッチ 398
お茶 120
小計 518
合計 ¥560
`;
    expect(extractTotalAmount(text)).toBe(560);
  });

  it("recognizes ご請求 keyword", () => {
    expect(extractTotalAmount("ご請求金額 2,480円")).toBe(2480);
  });

  it("falls back to the largest amount when no total keyword", () => {
    const text = `
ローソン
牛乳 198
パン 150
`;
    expect(extractTotalAmount(text)).toBe(198);
  });

  it("returns null when no amounts exist", () => {
    expect(extractTotalAmount("ありがとう")).toBeNull();
  });
});

describe("extractStoreName", () => {
  it("uses the first meaningful line", () => {
    const text = `
2024/05/01 12:34
TEL 03-1234-5678
ファミリーマート渋谷店
おにぎり 120
合計 130円
`;
    expect(extractStoreName(text)).toBe("ファミリーマート渋谷店");
  });

  it("skips receipt header labels", () => {
    const text = `
領収書
イオンモール
合計 1,000円
`;
    expect(extractStoreName(text)).toBe("イオンモール");
  });
});

describe("parseReceiptText", () => {
  it("returns store name and total", () => {
    const result = parseReceiptText(`
まいばすけっと
牛乳 198
合計 ¥218
`);
    expect(result).toEqual({ storeName: "まいばすけっと", amount: 218 });
  });

  it("throws when total cannot be read", () => {
    expect(() => parseReceiptText("こんにちは")).toThrow(
      "合計金額を読み取れませんでした",
    );
  });

  it("allows empty store name when only amount is present", () => {
    expect(parseReceiptText("合計 500円")).toEqual({
      storeName: "",
      amount: 500,
    });
  });
});
