// One-time: move news that clearly belongs to 지역아동센터 into JIYEOK category.
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.newsArticle.updateMany({
    where: {
      OR: [
        { title: { contains: "지역아동센터" } },
        { summary: { contains: "지역아동센터" } },
        { point: { contains: "지역아동센터" } },
      ],
    },
    data: { category: "JIYEOK" },
  });
  console.log(`✓ Reclassified ${result.count} articles to JIYEOK`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
