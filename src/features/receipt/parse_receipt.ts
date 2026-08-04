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

const DATE_PATTERN =
  /\d{4}\s*[年/\-.]\s*\d{1,2}|\d{1,2}\s*[月/\-.]\s*\d{1,2}|\d{2}:\d{2}/;
const PHONE_PATTERN = /(?:TEL|電話)?\s*\d{2,4}[-(]\d{2,4}[-)]\d{3,4}/i;
const AMOUNT_ONLY_PATTERN =
  /^(?:(?:¥|￥)\s*[\d,]+|[\d,]+\s*円|[\d,]+)$/;

function normalizeFullWidthDigits(value: string): string {
  return value
    .replace(/[０-９]/g, (char) =>
      String.fromCharCode(char.charCodeAt(0) - 0xff10 + 0x30),
    )
    .replace(/，/g, ",");
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
  return amount;
}

export function extractAmounts(line: string): number[] {
  const normalized = normalizeFullWidthDigits(line);
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
    // Skip bare numbers without currency on date/phone lines, short codes, or years.
    if (match[3] && !hasCurrencyCue) {
      if (digits.length < 3 || digits.length === 4) {
        continue;
      }
      if (DATE_PATTERN.test(normalized) || PHONE_PATTERN.test(normalized)) {
        continue;
      }
    }
    const amount = parseAmountToken(raw);
    if (amount !== null) {
      amounts.push(amount);
    }
  }

  return amounts;
}

function isTotalLine(line: string): boolean {
  const lower = line.toLowerCase();
  return TOTAL_KEYWORDS.some((keyword) =>
    lower.includes(keyword.toLowerCase()),
  );
}

function isLikelyNoiseLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) {
    return true;
  }
  if (DATE_PATTERN.test(trimmed)) {
    return true;
  }
  if (PHONE_PATTERN.test(trimmed)) {
    return true;
  }
  if (AMOUNT_ONLY_PATTERN.test(normalizeFullWidthDigits(trimmed))) {
    return true;
  }
  if (/^(領収書|レシート|領\s*収|控え)$/i.test(trimmed)) {
    return true;
  }
  return false;
}

export function extractStoreName(text: string): string {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines.slice(0, 8)) {
    if (isLikelyNoiseLine(line)) {
      continue;
    }
    if (isTotalLine(line)) {
      continue;
    }
    // Avoid long itemized lines
    if (line.length > 40) {
      continue;
    }
    return line.replace(/\s+/g, " ");
  }

  return "";
}

export function extractTotalAmount(text: string): number | null {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    if (!isTotalLine(line)) {
      continue;
    }
    const amounts = extractAmounts(line);
    if (amounts.length > 0) {
      return Math.max(...amounts);
    }
  }

  // Fallback: largest amount in the whole receipt (often tax-included total)
  const allAmounts = lines
    .filter((line) => !DATE_PATTERN.test(line) && !PHONE_PATTERN.test(line))
    .flatMap((line) => extractAmounts(line));
  if (allAmounts.length === 0) {
    return null;
  }
  return Math.max(...allAmounts);
}

export function parseReceiptText(text: string): ParsedReceipt {
  const amount = extractTotalAmount(text);
  if (amount === null) {
    throw new Error("合計金額を読み取れませんでした。手入力してください。");
  }

  return {
    storeName: extractStoreName(text),
    amount,
  };
}
