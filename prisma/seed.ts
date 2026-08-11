import { PrismaClient } from "@prisma/client";
import { DISTRICTS } from "../src/lib/districts";

const prisma = new PrismaClient();

async function main() {
  for (const d of DISTRICTS) {
    await prisma.district.upsert({
      where: { id: d.id },
      update: {
        nameKo: d.nameKo,
        nameEn: d.nameEn,
        lat: d.lat,
        lng: d.lng,
        radiusM: d.radiusM,
      },
      create: {
        id: d.id,
        nameKo: d.nameKo,
        nameEn: d.nameEn,
        lat: d.lat,
        lng: d.lng,
        radiusM: d.radiusM,
      },
    });
  }
  console.log(`Seeded ${DISTRICTS.length} districts.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
