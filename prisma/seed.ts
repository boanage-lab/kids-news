import { createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { SEED_NEWS } from "../src/lib/seed-data";

const prisma = new PrismaClient();

function sha256(s: string) {
  return createHash("sha256").update(s).digest("hex");
}

async function main() {
  console.log("Seeding news articles...");
  for (const item of SEED_NEWS) {
    const hash = sha256(`${item.title}|${item.source}`);
    await prisma.newsArticle.upsert({
      where: { hash },
      create: {
        hash,
        title: item.title,
        summary: item.summary,
        detail: item.detail,
        impact: item.impact,
        point: item.point,
        category: item.category,
        source: item.source,
        url: item.url ?? null,
        publishedAt: new Date(item.publishedAt),
      },
      update: {},
    });
  }
  const count = await prisma.newsArticle.count();
  console.log(`✓ Seeded. NewsArticle rows: ${count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
