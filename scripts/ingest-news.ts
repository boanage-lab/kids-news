// Ingests a JSON array of news items into the DB.
//
// Usage:
//   npm run ingest -- path/to/news.json
//   npm run ingest -- -              # read from stdin
//
// Accepts items shaped like (category can be Korean label or code):
// [{
//   "title": "...",
//   "summary": "...",
//   "detail": "...",
//   "impact": "...",
//   "point": "...",
//   "category": "정책" | "복지" | "교육" | "안전" | "건강" | "POLICY" | ...,
//   "source": "기관/매체명",
//   "url": "https://...",          // optional
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
};
const VALID = new Set(["POLICY", "WELFARE", "EDUCATION", "SAFETY", "HEALTH"]);

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
  for (const it of items) {
    const title = typeof it.title === "string" ? it.title.trim() : "";
    const source = typeof it.source === "string" ? it.source.trim() : "";
    if (!title || !source) {
      failed++;
      continue;
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
          url: typeof it.url === "string" && it.url ? it.url : null,
          publishedAt: parseDate(it.date),
        },
        update: {},
      });
      if (before) existed++;
      else created++;
    } catch (e) {
      failed++;
      console.error(`  ✗ ${title.slice(0, 40)}: ${e instanceof Error ? e.message : e}`);
    }
  }

  console.log(`Done. created=${created} existed=${existed} failed=${failed}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
