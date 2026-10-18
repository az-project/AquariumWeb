// 시리 단축어 받아쓰기 문장("오늘 인산염 0.01 질산염 3.0")을 수질 로그 값으로 변환한다.
import type { WaterLog } from "@/lib/domain/types";

export type WaterLogField = "temp" | "salinity" | "kh" | "ph" | "gh" | "no3" | "no2" | "nh3" | "po4";

export interface ParsedQuickLog {
  date?: string;
  values: Partial<Record<WaterLogField, number>>;
}

export const FIELD_LABELS: Record<WaterLogField, string> = {
  temp: "온도",
  salinity: "염도",
  kh: "KH",
  ph: "pH",
  gh: "GH",
  no3: "질산염",
  no2: "아질산염",
  nh3: "암모니아",
  po4: "인산염"
};

const FIELD_KEYWORDS: Record<WaterLogField, string[]> = {
  po4: ["인산염", "인산", "po4", "피오포", "phosphate"],
  no3: ["질산염", "질산", "no3", "엔오쓰리", "nitrate"],
  no2: ["아질산염", "아질산", "no2", "엔오투", "nitrite"],
  nh3: ["암모니아", "nh3", "nh4", "ammonia"],
  kh: ["알칼리니티", "카보네이트", "dkh", "kh", "케이에이치", "alkalinity"],
  gh: ["총경도", "gh", "지에이치"],
  ph: ["피에이치", "ph"],
  salinity: ["염도", "비중", "salinity"],
  temp: ["수온", "온도", "temp", "temperature"]
};

const DATE_OFFSETS: Array<[string, number]> = [
  ["그저께", -2],
  ["그제", -2],
  ["어제", -1],
  ["오늘", 0]
];

const KEYWORD_TO_FIELD = new Map<string, WaterLogField>(
  Object.entries(FIELD_KEYWORDS).flatMap(([field, words]) => words.map(word => [word, field as WaterLogField] as const))
);

// 긴 키워드를 먼저 시도해야 "아질산"이 "질산"으로, "총경도"가 다른 키워드로 잘못 잡히지 않는다.
const KEYWORD_PATTERN = new RegExp(
  [...KEYWORD_TO_FIELD.keys()]
    .sort((a, b) => b.length - a.length)
    .map(word => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|"),
  "g"
);

const KOREAN_DIGITS: Record<string, number> = {
  영: 0, 공: 0, 일: 1, 이: 2, 삼: 3, 사: 4, 오: 5, 육: 6, 륙: 6, 칠: 7, 팔: 8, 구: 9
};

function parseKoreanInteger(text: string): number | undefined {
  if (!text) return undefined;
  if (!/[십백]/.test(text)) {
    // "영", "삼" 같은 한 자리 또는 자릿수 단위 없이 읽은 숫자
    let value = 0;
    for (const char of text) {
      if (!(char in KOREAN_DIGITS)) return undefined;
      value = value * 10 + KOREAN_DIGITS[char];
    }
    return value;
  }
  let total = 0;
  let current = 0;
  for (const char of text) {
    if (char === "백" || char === "십") {
      total += (current || 1) * (char === "백" ? 100 : 10);
      current = 0;
    } else if (char in KOREAN_DIGITS) {
      current = KOREAN_DIGITS[char];
    } else {
      return undefined;
    }
  }
  return total + current;
}

// 받아쓰기가 숫자를 한글로 남긴 경우("영점영일", "삼점영", "이십오")를 처리한다.
function parseKoreanNumber(text: string): number | undefined {
  const [integerPart, fractionPart, ...rest] = text.split("점");
  if (rest.length) return undefined;
  const integer = integerPart ? parseKoreanInteger(integerPart) : 0;
  if (integer === undefined) return undefined;
  if (fractionPart === undefined) return integerPart ? integer : undefined;
  let fraction = "";
  for (const char of fractionPart) {
    if (!(char in KOREAN_DIGITS)) return undefined;
    fraction += KOREAN_DIGITS[char];
  }
  if (!fraction) return undefined;
  return Number(`${integer}.${fraction}`);
}

function parseSegmentValue(segment: string): number | undefined {
  const digits = /^[\s:=은는이가]*(-?\d+(?:\.\d+)?)/.exec(segment) || /(-?\d+(?:\.\d+)?)/.exec(segment);
  if (digits) return Number(digits[1]);
  const korean = /^[\s:=]*(?:[은는가]|이(?=\s))?\s*([영공일이삼사오육륙칠팔구십백점]+)/.exec(segment);
  return korean ? parseKoreanNumber(korean[1]) : undefined;
}

export function shiftIsoDate(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function parseQuickLogText(text: string, today: string): ParsedQuickLog {
  const normalized = text.toLowerCase().replace(/,/g, " ").replace(/(\d)\s*\.\s*(\d)/g, "$1.$2");
  const result: ParsedQuickLog = { values: {} };

  const dateWord = DATE_OFFSETS.find(([word]) => normalized.includes(word));
  if (dateWord) result.date = shiftIsoDate(today, dateWord[1]);
  const explicitDate = /(\d{4})[-./년\s]+(\d{1,2})[-./월\s]+(\d{1,2})일?/.exec(normalized);
  if (explicitDate) {
    result.date = `${explicitDate[1]}-${explicitDate[2].padStart(2, "0")}-${explicitDate[3].padStart(2, "0")}`;
  }
  const withoutDates = explicitDate ? normalized.replace(explicitDate[0], " ") : normalized;

  const matches = [...withoutDates.matchAll(KEYWORD_PATTERN)];
  matches.forEach((match, index) => {
    const field = KEYWORD_TO_FIELD.get(match[0]);
    if (!field) return;
    const start = (match.index ?? 0) + match[0].length;
    const end = matches[index + 1]?.index ?? withoutDates.length;
    const value = parseSegmentValue(withoutDates.slice(start, end));
    if (value !== undefined && Number.isFinite(value)) result.values[field] = value;
  });

  return result;
}

export function mergeWaterLog(logs: WaterLog[], date: string, values: Partial<Omit<WaterLog, "date">>): { logs: WaterLog[]; log: WaterLog } {
  const existing = logs.find(item => item.date === date);
  const log: WaterLog = { ...existing, ...values, date };
  const next = [...logs.filter(item => item.date !== date), log].sort((a, b) => a.date.localeCompare(b.date));
  return { logs: next, log };
}

export function describeValues(values: ParsedQuickLog["values"]): string {
  return (Object.keys(FIELD_LABELS) as WaterLogField[])
    .filter(field => values[field] !== undefined)
    .map(field => `${FIELD_LABELS[field]} ${values[field]}`)
    .join(", ");
}

export function todayInTimeZone(timeZone: string, now = new Date()): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  } catch {
    return now.toISOString().slice(0, 10);
  }
}
