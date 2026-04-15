import Anthropic from "@anthropic-ai/sdk";
import { createHash } from "node:crypto";
import { z } from "zod";
import { prisma } from "./prisma";
import { toCategoryCode } from "./categories";

const SYSTEM_PROMPT = `당신은 아동 뉴스 큐레이터입니다. 한국의 최신 아동 관련 뉴스를 검색한 후, 아래 형식의 JSON 배열만 반환하세요. 마크다운 백틱이나 다른 텍스트는 절대 포함하지 마세요.
[{"title":"제목","summary":"2~3문장 요약","detail":"5~7문장 상세 내용 (수치·정책 포함)","impact":"지역아동센터 현장 영향 2~3문장","point":"핵심 한 줄 요약","category":"정책|복지|교육|안전|건강|지역아동센터","source":"출처기관명","date":"YYYY-MM-DD","url":"실제 기사 URL (검색결과에서 찾은 실제 링크, 없으면 빈 문자열)"}]
5~7개 뉴스를 반환하세요. url은 반드시 실제로 존재하는 기사 링크여야 합니다.`;

const ItemSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  detail: z.string().min(1),
  impact: z.string().default(""),
  point: z.string().default(""),
  category: z.string().default("정책"),
  source: z.string().default("출처 미상"),
  date: z.string().default(""),
  url: z.string().default(""),
});

function sha256(s: string) {
  return createHash("sha256").update(s).digest("hex");
}

function parseDate(s: string | undefined): Date {
  if (!s) return new Date();
  // accept YYYY-MM-DD, YYYY.MM.DD, YYYY/MM/DD
  const normalized = s.replace(/[./]/g, "-").slice(0, 10);
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? new Date() : d;
}

function extractJsonArray(text: string): unknown[] {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("No JSON array found in response");
  return JSON.parse(match[0]);
}

export interface CollectResult {
  ok: boolean;
  count: number;
  inserted: number;
  skipped: number;
  error?: string;
}

export async function collectAndStoreNews(): Promise<CollectResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { ok: false, count: 0, inserted: 0, skipped: 0, error: "ANTHROPIC_API_KEY not set" };
  }

  const client = new Anthropic({ apiKey });
  let responseText = "";
  try {
    const res = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 4000,
      tools: [{ type: "web_search_20250305", name: "web_search" } as never],
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: "오늘 기준 한국 아동 관련 최신 뉴스를 검색해서 JSON으로 알려주세요.",
        },
      ],
    });
    responseText = res.content
      .map((c) => (c.type === "text" ? c.text : ""))
      .join("\n");
  } catch (e) {
    return {
      ok: false,
      count: 0,
      inserted: 0,
      skipped: 0,
      error: e instanceof Error ? e.message : String(e),
    };
  }

  let raw: unknown[];
  try {
    raw = extractJsonArray(responseText);
  } catch (e) {
    return {
      ok: false,
      count: 0,
      inserted: 0,
      skipped: 0,
      error: `Parse failure: ${e instanceof Error ? e.message : String(e)}`,
    };
  }

  let inserted = 0;
  let skipped = 0;
  for (const item of raw) {
    const parsed = ItemSchema.safeParse(item);
    if (!parsed.success) {
      skipped++;
      continue;
    }
    const d = parsed.data;
    const hash = sha256(`${d.title}|${d.source}`);
    try {
      const result = await prisma.newsArticle.upsert({
        where: { hash },
        create: {
          hash,
          title: d.title,
          summary: d.summary,
          detail: d.detail,
          impact: d.impact,
          point: d.point,
          category: toCategoryCode(d.category),
          source: d.source,
          url: d.url || null,
          publishedAt: parseDate(d.date),
        },
        update: {}, // dedupe — keep first version
      });
      // upsert returns the record; we can't tell insert vs existing easily, so count changes
      if (result.collectedAt.getTime() > Date.now() - 5000) inserted++;
      else skipped++;
    } catch {
      skipped++;
    }
  }

  return { ok: true, count: raw.length, inserted, skipped };
}
