import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ranks = [
  { name: "Wedkarz", colorHex: "#16a34a" },
  { name: "Admin", colorHex: "#22c55e" },
];

const regions = [
  "Dolnoslaskie",
  "Kujawsko-Pomorskie",
  "Lubelskie",
  "Lubuskie",
  "Lodzkie",
  "Malopolskie",
  "Mazowieckie",
  "Opolskie",
  "Podkarpackie",
  "Podlaskie",
  "Pomorskie",
  "Slaskie",
  "Swietokrzyskie",
  "Warminsko-Mazurskie",
  "Wielkopolskie",
  "Zachodniopomorskie",
  "Zagranica",
];

const fishingMethods = [
  "spinning",
  "spławik",
  "feeder",
  "grunt",
  "karpiarstwo",
  "muchowa",
  "trolling",
  "podlodowe",
  "morskie",
  "sumowe",
  "casting",
];

const defaultSiteSettings = [
  { key: "siteName", value: "RybiaPaka.pl" },
  { key: "maintenanceMode", value: "false" },
];

async function main() {
  for (const rank of ranks) {
    await prisma.rank.upsert({
      where: { name: rank.name },
      update: rank,
      create: rank,
    });
  }

  for (const name of regions) {
    await prisma.region.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  for (const name of fishingMethods) {
    await prisma.fishingMethod.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  for (const setting of defaultSiteSettings) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
