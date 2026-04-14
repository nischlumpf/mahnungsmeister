import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "./prisma/schema.prisma",
  migrate: {
    async adapter() {
      const { PrismaPg } = await import("@prisma/adapter-pg");
      const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
      if (!connectionString) throw new Error("DIRECT_URL or DATABASE_URL must be set");
      return new PrismaPg({ connectionString });
    },
  },
});
