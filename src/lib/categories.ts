export const CATEGORY_CODES = [
  "POLICY",
  "WELFARE",
  "EDUCATION",
  "SAFETY",
  "HEALTH",
  "JIYEOK",
  "INCIDENT",
] as const;
export type CategoryCode = (typeof CATEGORY_CODES)[number];

export const CATEGORY_LABEL: Record<CategoryCode, string> = {
  POLICY: "정책",
  WELFARE: "복지",
  EDUCATION: "교육",
  SAFETY: "안전",
  HEALTH: "건강",
  JIYEOK: "지역아동센터",
  INCIDENT: "사건사고",
};

export const CATEGORY_BADGE: Record<CategoryCode, string> = {
  POLICY: "bg-emerald-50 text-emerald-900 ring-emerald-200",
  WELFARE: "bg-indigo-50 text-indigo-900 ring-indigo-200",
  EDUCATION: "bg-sky-50 text-sky-900 ring-sky-200",
  SAFETY: "bg-orange-50 text-orange-900 ring-orange-200",
  HEALTH: "bg-lime-50 text-lime-900 ring-lime-200",
  JIYEOK: "bg-rose-50 text-rose-900 ring-rose-200",
  INCIDENT: "bg-red-50 text-red-900 ring-red-200",
};

const LABEL_TO_CODE: Record<string, CategoryCode> = {
  정책: "POLICY",
  복지: "WELFARE",
  교육: "EDUCATION",
  안전: "SAFETY",
  건강: "HEALTH",
  지역아동센터: "JIYEOK",
  사건사고: "INCIDENT",
};

/** Accepts "정책", "POLICY", "policy" and returns a valid code, default POLICY. */
export function toCategoryCode(v: string | undefined | null): CategoryCode {
  if (!v) return "POLICY";
  const up = v.toUpperCase();
  if ((CATEGORY_CODES as readonly string[]).includes(up)) return up as CategoryCode;
  return LABEL_TO_CODE[v] ?? "POLICY";
}

export function labelOf(code: string): string {
  const c = toCategoryCode(code);
  return CATEGORY_LABEL[c];
}
