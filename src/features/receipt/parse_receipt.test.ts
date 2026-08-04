import {
  collapseDigitGaps,
  extractAmounts,
  extractTotalAmount,
  parseAmountCloseup,
  parseReceiptText,
} from "@/features/receipt/parse_receipt";
import { describe, expect, it } from "vitest";

describe("collapseDigitGaps", () => {
  it("joins digits split by spaces or dots", () => {
    expect(collapseDigitGaps("合 計 1 2 3 6")).toContain("1236");
    expect(collapseDigitGaps("¥1.980")).toContain("1980");
  });
});

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
  it("prefers the total line", () => {
    expect(extractTotalAmount("小計 518\n合計 ¥560")).toBe(560);
  });

  it("recognizes ご請求 keyword", () => {
    expect(extractTotalAmount("ご請求金額 2,480円")).toBe(2480);
  });

  it("returns null when no total keyword", () => {
    expect(extractTotalAmount("牛乳 198\nパン 150")).toBeNull();
  });
});

describe("parseAmountCloseup", () => {
  it("reads a total keyword line", () => {
    expect(parseAmountCloseup("合計 ¥1,280")).toBe(1280);
  });

  it("reads a yen amount without keyword", () => {
    expect(parseAmountCloseup("¥2,480")).toBe(2480);
  });

  it("reads OCR text with spaced digits", () => {
    expect(parseAmountCloseup("合 計 ￥ 1 5 8 0 円")).toBe(1580);
  });

  it("falls back to the largest number in the crop", () => {
    expect(parseAmountCloseup("税 128\n1580")).toBe(1580);
  });

  it("throws when nothing looks like an amount", () => {
    expect(() => parseAmountCloseup("ありがとう")).toThrow(
      "合計金額を読み取れませんでした",
    );
  });
});

describe("parseReceiptText", () => {
  it("returns amount only (store name left blank for manual entry)", () => {
    expect(parseReceiptText("合計 500円")).toEqual({
      storeName: "",
      amount: 500,
    });
  });
});
