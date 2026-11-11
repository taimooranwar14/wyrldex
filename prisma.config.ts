import { existsSync } from "node:fs";
import { defineConfig } from "prisma/config";

// Prisma 7 no longer reads .env itself; Node 24 can. CI sets DATABASE_URL directly, with no .env file.
if (existsSync(".env")) process.loadEnvFile();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node prisma/seed.mts",
  },
  datasource: {
    // Not env(): that throws when unset, which would break `prisma generate` on a fresh install.
    url: process.env.DATABASE_URL ?? "",
  },
});
