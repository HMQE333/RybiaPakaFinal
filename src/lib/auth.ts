import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createFieldAttribute } from "better-auth/db";
import { nextCookies, toNextJsHandler } from "better-auth/next-js";
import bcrypt from "bcryptjs";
import { APIError } from "better-auth/api";

import prisma from "./prisma";
import { sendMail } from "./mailer";
import { getRandomDefaultAvatar } from "./avatarDefaults";

const secret =
  process.env.BETTER_AUTH_SECRET ??
  process.env.AUTH_SECRET ??
  process.env.NEXTAUTH_SECRET ??
  "dev-secret-change-me-please-0123456789";

const baseURL =
  process.env.BETTER_AUTH_URL ??
  process.env.NEXTAUTH_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  "http://localhost:3000";

const socialProviders: Record<string, any> = {};

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  socialProviders.google = {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  };
}

if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
  socialProviders.facebook = {
    clientId: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
  };
}

if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) {
  socialProviders.discord = {
    clientId: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
  };
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider:
      process.env.DATA_DB_PROVIDER?.toLowerCase() === "postgresql"
        ? "postgresql"
        : "sqlite",
    transaction: false,
  }),
  advanced: {
    database: {
      generateId: "serial",
    },
  },
  logger: { level: "debug" },
  onAPIError: {
    onError(error) {
      // Log full error for diagnosis (avoid swallowing in Next logs).
      // eslint-disable-next-line no-console
      console.error("[better-auth] API error", error);
    },
  },
  databaseHooks: {
    user: {
      create: {
        async before(user) {
          const email =
            typeof user.email === "string"
              ? user.email.trim().toLowerCase()
              : "";
          const username =
            typeof user.username === "string" ? user.username.trim() : "";
          const nick = typeof user.nick === "string" ? user.nick.trim() : "";
          const avatarUrl =
            typeof user.avatarUrl === "string" ? user.avatarUrl.trim() : "";
          const candidates = [username, nick].filter(Boolean);
          const fallbackAvatar = avatarUrl || getRandomDefaultAvatar();

          if (email) {
            const existingEmail = await prisma.$queryRaw<{ id: number }[]>`
              SELECT "id"
              FROM "User"
              WHERE lower("email") = ${email}
              LIMIT 1
            `;

            if (existingEmail.length > 0) {
              throw new APIError("BAD_REQUEST", {
                message: "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL",
              });
            }
          }

          if (candidates.length > 0) {
            const lowered = candidates.map((value) => value.toLowerCase());
            const existing = await prisma.$queryRaw<{ id: number }[]>`
              SELECT "id"
              FROM "User"
              WHERE ("username" IS NOT NULL AND lower("username") IN (${Prisma.join(
                lowered
              )}))
                OR ("nick" IS NOT NULL AND lower("nick") IN (${Prisma.join(lowered)}))
              LIMIT 1
            `;

            if (existing.length > 0) {
              throw new APIError("BAD_REQUEST", {
                message: "USERNAME_IS_ALREADY_TAKEN",
              });
            }
          }

          return {
            data: {
              ...user,
              email: email || user.email,
              username: username || null,
              nick: nick || null,
              avatarUrl: avatarUrl || fallbackAvatar,
            },
          };
        },
      },
    },
    account: {
      create: {
        async before(account) {
          return {
            data: {
              ...account,
              // Ensure accountId is stored as text (Prisma expects string).
              accountId: String(
                account.accountId ?? account.userId ?? crypto.randomUUID()
              ),
              userId:
                typeof account.userId === "string"
                  ? Number(account.userId)
                  : account.userId,
            } as any,
          };
        },
      },
    },
  },
  baseURL,
  secret,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    password: {
      hash: async (password) => bcrypt.hash(password, 10),
      verify: async ({ hash, password }) => bcrypt.compare(password, hash),
    },
    sendResetPassword: async ({ user, url }) => {
      const subject = "Reset hasła w RybiaPaka.pl";
      const text = `Cześć${user.name ? ` ${user.name}` : ""}!\n\nKliknij w link, aby ustawić nowe hasło:\n${url}\n\nJeśli to nie Ty, zignoruj tę wiadomość.`;
      const html = `
        <p>Cześć${user.name ? ` ${user.name}` : ""}!</p>
        <p>Kliknij w link, aby ustawić nowe hasło:</p>
        <p><a href="${url}">${url}</a></p>
        <p>Jeśli to nie Ty, zignoruj tę wiadomość.</p>
      `;

      await sendMail({
        to: user.email,
        subject,
        text,
        html,
      });
    },
    revokeSessionsOnPasswordReset: true,
  },
  socialProviders: Object.keys(socialProviders).length
    ? (socialProviders as any)
    : undefined,
  user: {
    additionalFields: {
      username: createFieldAttribute("string", { unique: true, required: false }),
      nick: createFieldAttribute("string", { unique: true, required: false }),
      role: createFieldAttribute("string", {
        required: false,
        defaultValue: "NORMAL",
      }),
      avatarUrl: createFieldAttribute("string", { required: false }),
      bio: createFieldAttribute("string", { required: false }),
      age: createFieldAttribute("number", { required: false }),
      joinedAt: createFieldAttribute("date", {
        required: false,
        defaultValue: () => new Date(),
      }),
      rankId: createFieldAttribute("string", { required: false }),
      regionId: createFieldAttribute("string", { required: false }),
    },
  },
  plugins: [nextCookies()],
});

export async function getSessionSafe(headers: Headers) {
  try {
    return await auth.api.getSession({ headers });
  } catch {
    return null;
  }
}

export const { GET, POST, PUT, PATCH, DELETE } = toNextJsHandler(auth);
