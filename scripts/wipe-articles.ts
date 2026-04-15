// Danger: deletes ALL news articles (and cascade-deletes bookmarks/reads on them).
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const res = await prisma.newsArticle.deleteMany({});
  console.log(`✓ Deleted ${res.count} articles`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
