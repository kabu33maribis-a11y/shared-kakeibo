export interface ParsedReceipt {
  storeName: string;
  amount: number;
}

const TOTAL_KEYWORDS = [
  "合計",
  "ご請求",
  "請求額",
  "お会計",
  "お買上げ",
  "お買い上げ",
  "total",
  "amount due",
];

const AMOUNT_PATTERN = /(?:¥|￥)\s*([\d,]+)|([\d,]+)\s*円|([\d,]+)/g;

function normalizeFullWidthDigits(value: string): string {
  return value
    .replace(/[０-９]/g, (char) =>
      String.fromCharCode(char.charCodeAt(0) - 0xff10 + 0x30),
    )
    .replace(/，/g, ",");
}

/** Join digits that OCR split with spaces or dots on the same line. */
export function collapseDigitGaps(text: string): string {
  return normalizeFullWidthDigits(text)
    .split(/\r?\n/)
    .map((line) => {
      let current = line;
      let previous = "";
      while (previous !== current) {
        previous = current;
        // Keep commas as thousand separators; collapse spaces/dots between digits.
        current = current.replace(/(\d)[.\u00a0 ]+(?=\d)/g, "$1");
      }
      return current;
    })
    .join("\n");
}

function parseAmountToken(raw: string): number | null {
  const digits = normalizeFullWidthDigits(raw).replace(/,/g, "");
  if (!/^\d+$/.test(digits)) {
    return null;
  }
  const amount = Number(digits);
  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }
  // Ignore implausible household expense totals from OCR noise.
  if (amount > 9_999_999) {
    return null;
  }
  return amount;
}

function isTotalLine(line: string): boolean {
  const lower = line.toLowerCase();
  return TOTAL_KEYWORDS.some((keyword) =>
    lower.includes(keyword.toLowerCase()),
  );
}

export function extractAmounts(line: string, loose = false): number[] {
  const normalized = collapseDigitGaps(line);
  const amounts: number[] = [];
  AMOUNT_PATTERN.lastIndex = 0;

  const hasCurrencyCue =
    /(?:¥|￥|円)/.test(normalized) ||
    TOTAL_KEYWORDS.some((keyword) =>
      normalized.toLowerCase().includes(keyword.toLowerCase()),
    );

  for (const match of normalized.matchAll(AMOUNT_PATTERN)) {
    const raw = match[1] ?? match[2] ?? match[3];
    if (!raw) {
      continue;
    }
    const digits = raw.replace(/,/g, "");
    if (match[3] && !hasCurrencyCue && !loose) {
      // Strict mode: skip tiny / year-like bare numbers on cluttered receipts.
      if (digits.length < 3) {
        continue;
      }
    }
    if (match[3] && !hasCurrencyCue && loose && digits.length < 2) {
      continue;
    }
    const amount = parseAmountToken(raw);
    if (amount !== null) {
      amounts.push(amount);
    }
  }

  return amounts;
}

export function extractTotalAmount(text: string): number | null {
  const normalized = collapseDigitGaps(text);
  const lines = normalized
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    if (!isTotalLine(line)) {
      continue;
    }
    const amounts = extractAmounts(line, true);
    if (amounts.length > 0) {
      return Math.max(...amounts);
    }
  }

  return null;
}

/**
 * Parse a close-up photo of the total amount region.
 * Store name is not inferred (user fills it in).
 */
export function parseAmountCloseup(text: string): number {
  const normalized = collapseDigitGaps(text);

  const fromKeyword = extractTotalAmount(normalized);
  if (fromKeyword !== null) {
    return fromKeyword;
  }

  const lines = normalized
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const currencyAmounts = lines.flatMap((line) => {
    if (!/(?:¥|￥|円)/.test(line)) {
      return [];
    }
    return extractAmounts(line, true);
  });
  if (currencyAmounts.length > 0) {
    return Math.max(...currencyAmounts);
  }

  const allAmounts = lines.flatMap((line) => extractAmounts(line, true));
  if (allAmounts.length === 0) {
    throw new Error(
      "合計金額を読み取れませんでした。枠内に金額が大きく映るよう再撮影するか、手入力してください。",
    );
  }

  // Close-up of the total line: the dominant number is usually the total.
  return Math.max(...allAmounts);
}

export function parseReceiptText(text: string): ParsedReceipt {
  return {
    storeName: "",
    amount: parseAmountCloseup(text),
  };
}
