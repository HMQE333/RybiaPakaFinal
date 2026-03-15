import { PrismaClient } from "@prisma/client";
import { ReportCategory, ReportStatus, Role } from "../src/lib/prismaEnums";
import bcrypt from "bcryptjs";

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
  "feeder",
  "grunt",
  "karpiarstwo",
  "muchowa",
  "splawik",
  "trolling",
  "podlodowe",
];

const defaultSiteSettings = [
  { key: "siteName", value: "RybiaPaka.pl" },
  { key: "maintenanceMode", value: "false" },
];

async function linkUserMethod(userId: number, methodName: string) {
  const method = await prisma.fishingMethod.findUnique({
    where: { name: methodName },
  });
  if (!method) return;

  await prisma.userFishingMethod.upsert({
    where: {
      userId_methodId: {
        userId,
        methodId: method.id,
      },
    },
    create: {
      userId,
      methodId: method.id,
    },
    update: {},
  });
}

async function upsertCredentialAccount(userId: number, passwordHash: string) {
  await prisma.account.upsert({
    where: {
      providerId_accountId: {
        providerId: "credential",
        accountId: String(userId),
      },
    },
    update: {
      password: passwordHash,
    },
    create: {
      userId,
      providerId: "credential",
      accountId: String(userId),
      password: passwordHash,
    },
  });
}

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

  const email = "jan@example.com";
  const existing = await prisma.user.findUnique({ where: { email } });
  let userId: number;

  if (!existing) {
    const passwordHash = await bcrypt.hash("Password123!", 10);
    const [region, rank] = await Promise.all([
      prisma.region.findUnique({ where: { name: "Mazowieckie" } }),
      prisma.rank.findUnique({ where: { name: "Admin" } }),
    ]);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: "Jan Kowalski",
        nick: "jan",
        username: "jan",
        role: Role.ADMIN,
        avatarUrl: "/artwork/404_user.png",
        bio: "Milosnik spinningu i feederowych wyzwan.",
        age: 28,
        joinedAt: new Date("2023-02-14T00:00:00Z"),
        regionId: region?.id ?? null,
        rankId: rank?.id ?? null,
        emailVerified: true,
      },
    });
    userId = user.id;

    await linkUserMethod(user.id, "spinning");
    await linkUserMethod(user.id, "feeder");
    await upsertCredentialAccount(user.id, passwordHash);
  } else {
    userId = existing.id;
  }

  const board = await prisma.board.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, name: "Ogolne" },
  });

  const threadTitle = "Pierwszy watek RybiaPaka.pl";
  let thread = await prisma.thread.findFirst({ where: { title: threadTitle } });
  if (!thread) {
    thread = await prisma.thread.create({
      data: {
        title: threadTitle,
        content: "Witamy na forum!",
        boardId: board.id,
        authorId: userId,
      },
    });
  }

  let rootPost = await prisma.post.findFirst({
    where: { threadId: thread.id, parentId: null },
  });
  if (!rootPost) {
    rootPost = await prisma.post.create({
      data: {
        content: "To jest pierwszy post watku.",
        threadId: thread.id,
        authorId: userId,
      },
    });
  }

  const reply = await prisma.post.findFirst({
    where: { parentId: rootPost.id },
  });
  if (!reply) {
    await prisma.post.create({
      data: {
        content: "A to jest komentarz do posta.",
        threadId: thread.id,
        authorId: userId,
        parentId: rootPost.id,
      },
    });
  }

  const other = await prisma.user.upsert({
    where: { email: "anna@example.com" },
    update: {},
    create: {
      email: "anna@example.com",
      name: "Anna Nowak",
      nick: "anna",
      username: "anna",
      age: 24,
      joinedAt: new Date("2024-05-01T00:00:00Z"),
      emailVerified: true,
    },
  });

  const otherPassword = await bcrypt.hash("Password123!", 10);
  await upsertCredentialAccount(other.id, otherPassword);

  await prisma.friendRequest.upsert({
    where: {
      senderId_receiverId: { senderId: userId, receiverId: other.id },
    },
    update: {},
    create: { senderId: userId, receiverId: other.id },
  });

  const existingMessage = await prisma.message.findFirst({
    where: { senderId: userId, receiverId: other.id },
  });
  if (!existingMessage) {
    await prisma.message.create({
      data: {
        senderId: userId,
        receiverId: other.id,
        text: "Czesc! Witaj na RybiaPaka.pl",
      },
    });
  }

  const existingNotification = await prisma.notification.findFirst({
    where: { userId, type: "NEW_MESSAGE" },
  });
  if (!existingNotification) {
    await prisma.notification.create({
      data: {
        userId,
        type: "NEW_MESSAGE",
        payload: JSON.stringify({ to: other.id }),
      },
    });
  }

  const channelSeedMessages = [
    {
      channelId: "spinning",
      text: "Startujemy rozmowy o sandaczu i szczupaku – kto ‘'owi dziś na Wi‘‡le?",
      authorId: userId,
    },
    {
      channelId: "karpiowanie",
      text: "Podbijam kana‘' #karpiowanie – ile kulek wrzucacie na nocne zasiadki?",
      authorId: other.id,
    },
    {
      channelId: "feeder",
      text: "Feederowcy, dajcie zna‘‡ czy woda na waszych ‘'owiskach ju‘» odpu‘>ci‘'a.",
      authorId: userId,
    },
    {
      channelId: "metoda",
      text: "Method wiosn‘' rz‘'dzi – co k‘'adziesz na podajnik?",
      authorId: userId,
    },
    {
      channelId: "splawik",
      text: "Sp‘'awikowcy, testuj‘t cienkie ‘>ywce 0.12 – t‘'umaczy‘'bym si‘' tu dalej.",
      authorId: other.id,
    },
    {
      channelId: "muchowe",
      text: "Muchowe – kto wi‘>e teraz oliwkowe nimfy na klenia?",
      authorId: userId,
    },
    {
      channelId: "podlodowe",
      text: "Lód jeszcze trzyma? Dajcie update spodlodowego.",
      authorId: other.id,
    },
    {
      channelId: "morskie",
      text: "Czy ktoś planuje rejs na dorsza w lutym?",
      authorId: userId,
    },
    {
      channelId: "memy",
      text: "Kana‘' memy stoi otworem – podrzucajcie ‘'artobliwe fotki!",
      authorId: other.id,
    },
    {
      channelId: "gry",
      text: "Kto gra dzisiaj w Fishing Planet po 20:00?",
      authorId: userId,
    },
  ];

  for (const seed of channelSeedMessages) {
    const exists = await prisma.channelMessage.findFirst({
      where: {
        channelId: seed.channelId,
        authorId: seed.authorId,
        text: seed.text,
      },
    });

    if (!exists) {
      await prisma.channelMessage.create({ data: seed });
    }
  }

  for (const setting of defaultSiteSettings) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }

  const reports = [
    {
      id: "seed-report-bug",
      title: "Formularz zgloszeniowy nie dziala",
      description: "Przycisk wyslij w formularzu nic nie robi.",
      category: ReportCategory.BUG,
      status: ReportStatus.IN_REVIEW,
      reporterId: userId,
    },
    {
      id: "seed-report-user",
      title: "Uzytkownik spamuje linkami",
      description: "Prosze o moderacje konta anna - dodaje linki afiliacyjne.",
      category: ReportCategory.USER,
      status: ReportStatus.PENDING,
      reporterId: userId,
      targetType: "User",
      targetId: `${other.id}`,
    },
    {
      id: "seed-report-content",
      title: "Post z linkiem do zewnetrznej aukcji",
      description: "Tresc w watku wymaga moderacji.",
      category: ReportCategory.CONTENT,
      status: ReportStatus.PENDING,
      reporterId: other.id,
      targetType: "Post",
      targetId: `${rootPost.id}`,
    },
  ];

  for (const report of reports) {
    await prisma.report.upsert({
      where: { id: report.id },
      update: report,
      create: report,
    });
  }

  const adminLogs = [
    {
      id: "seed-log-1",
      message: "Przywrocono baze deweloperska",
      level: "INFO",
      actorId: userId,
    },
    {
      id: "seed-log-2",
      message: "Zmieniono ustawienia strony",
      level: "WARN",
      actorId: userId,
    },
    {
      id: "seed-log-3",
      message: "Nowe zgloszenie tresci od Anna",
      level: "INFO",
      actorId: other.id,
    },
  ];

  for (const log of adminLogs) {
    await prisma.adminLog.upsert({
      where: { id: log.id },
      update: log,
      create: log,
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
