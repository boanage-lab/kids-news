// Ingests a JSON array of news items into the DB.
//
// Usage:
//   npm run ingest -- path/to/news.json
//   npm run ingest -- -              # read from stdin
//
// Hallucination防止 rules:
//   - url MUST be a real https:// URL. Items without url are rejected by default.
//   - url reachability is verified by a HEAD (or GET fallback) request.
//     On 2xx/3xx response → verified=true. Network error / 4xx / 5xx → verified=false.
//   - Flags:
//       INGEST_ALLOW_NO_URL=1   bypass URL requirement (not recommended)
//       INGEST_SKIP_HEAD=1      skip network check; accept url on regex only
//       INGEST_STRICT=1         reject items that fail the HEAD check
//
// Accepts items shaped like (category can be Korean label or code):
// [{
//   "title": "...",
//   "summary": "...",
//   "detail": "...",
//   "impact": "...",
//   "point": "...",
//   "category": "정책" | "복지" | "교육" | "안전" | "건강" | "지역아동센터" | "POLICY" | ...,
//   "source": "기관/매체명",
//   "url": "https://...",          // REQUIRED (unless INGEST_ALLOW_NO_URL=1)
//   "date": "2026-04-15"           // YYYY-MM-DD, optional (defaults to today)
// }, ...]
//
// Dedup is done by sha256(title + "|" + source); re-runs are safe.
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const LABEL_TO_CODE: Record<string, string> = {
  정책: "POLICY",
  복지: "WELFARE",
  교육: "EDUCATION",
  안전: "SAFETY",
  건강: "HEALTH",
  지역아동센터: "JIYEOK",
  사건사고: "INCIDENT",
};
const VALID = new Set(["POLICY", "WELFARE", "EDUCATION", "SAFETY", "HEALTH", "JIYEOK", "INCIDENT"]);

function toCode(v: unknown): string {
  if (typeof v !== "string") return "POLICY";
  const up = v.toUpperCase();
  if (VALID.has(up)) return up;
  return LABEL_TO_CODE[v] ?? "POLICY";
}

function parseDate(s: unknown): Date {
  if (typeof s !== "string" || !s) return new Date();
  const normalized = s.replace(/[./]/g, "-").slice(0, 10);
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? new Date() : d;
}

function sha256(s: string) {
  return createHash("sha256").update(s).digest("hex");
}

const URL_RE = /^https?:\/\/[^\s]+$/i;

const ALLOW_NO_URL = process.env.INGEST_ALLOW_NO_URL === "1";
const SKIP_HEAD = process.env.INGEST_SKIP_HEAD === "1";
const STRICT = process.env.INGEST_STRICT === "1";

/** Live-check url is reachable. Returns true on 2xx/3xx. 5s timeout. */
async function checkUrl(url: string): Promise<boolean> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5000);
  try {
    let res = await fetch(url, { method: "HEAD", signal: ctrl.signal, redirect: "follow" });
    // Some sites don't support HEAD; fall back to GET (no body read needed).
    if (res.status === 405 || res.status === 403) {
      res = await fetch(url, { method: "GET", signal: ctrl.signal, redirect: "follow" });
    }
    return res.status >= 200 && res.status < 400;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function readInput(arg: string | undefined): Promise<string> {
  if (!arg || arg === "-") {
    return new Promise((resolve, reject) => {
      let data = "";
      process.stdin.setEncoding("utf8");
      process.stdin.on("data", (c) => (data += c));
      process.stdin.on("end", () => resolve(data));
      process.stdin.on("error", reject);
    });
  }
  return readFileSync(arg, "utf8");
}

function extractJsonArray(text: string): unknown[] {
  // Tolerate markdown fences or extra prose around the JSON.
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("Could not find a JSON array in the input");
  return JSON.parse(match[0]);
}

interface Item {
  title?: unknown;
  summary?: unknown;
  detail?: unknown;
  impact?: unknown;
  point?: unknown;
  category?: unknown;
  source?: unknown;
  url?: unknown;
  date?: unknown;
}

async function main() {
  const arg = process.argv[2];
  const raw = await readInput(arg);
  const items = extractJsonArray(raw) as Item[];
  console.log(`Ingesting ${items.length} items...`);

  let created = 0;
  let existed = 0;
  let failed = 0;
  let verifiedCount = 0;
  for (const it of items) {
    const title = typeof it.title === "string" ? it.title.trim() : "";
    const source = typeof it.source === "string" ? it.source.trim() : "";
    const url = typeof it.url === "string" ? it.url.trim() : "";

    if (!title || !source) {
      console.error(`  ✗ 제목/출처 누락 — 스킵`);
      failed++;
      continue;
    }

    // URL 필수 검증
    if (!url || !URL_RE.test(url)) {
      if (!ALLOW_NO_URL) {
        console.error(`  ✗ ${title.slice(0, 40)}: URL 없음/형식 오류 — 스킵 (INGEST_ALLOW_NO_URL=1로 우회 가능)`);
        failed++;
        continue;
      }
    }

    // 도달 가능성 확인 (HEAD)
    let verified = false;
    if (url && URL_RE.test(url)) {
      if (SKIP_HEAD) {
        verified = true; // 형식만 맞으면 통과
      } else {
        verified = await checkUrl(url);
        if (!verified && STRICT) {
          console.error(`  ✗ ${title.slice(0, 40)}: URL 도달 실패 — 스킵 (INGEST_STRICT)`);
          failed++;
          continue;
        }
      }
    }

    const hash = sha256(`${title}|${source}`);
    try {
      const before = await prisma.newsArticle.findUnique({ where: { hash } });
      await prisma.newsArticle.upsert({
        where: { hash },
        create: {
          hash,
          title,
          summary: typeof it.summary === "string" ? it.summary : "",
          detail: typeof it.detail === "string" ? it.detail : "",
          impact: typeof it.impact === "string" ? it.impact : "",
          point: typeof it.point === "string" ? it.point : "",
          category: toCode(it.category),
          source,
          url: url || null,
          publishedAt: parseDate(it.date),
          verified,
        },
        update: { verified }, // 이미 있으면 검증 상태만 갱신
      });
      if (before) existed++;
      else created++;
      if (verified) verifiedCount++;
      console.log(`  ${verified ? "✓" : "~"} ${title.slice(0, 50)}${verified ? " [검증]" : " [미검증]"}`);
    } catch (e) {
      failed++;
      console.error(`  ✗ ${title.slice(0, 40)}: ${e instanceof Error ? e.message : e}`);
    }
  }

  console.log(
    `Done. created=${created} existed=${existed} verified=${verifiedCount} failed=${failed}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
