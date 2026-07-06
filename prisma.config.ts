import path from "node:path";
import fs from "node:fs";
import { defineConfig } from "prisma/config";

// Manually load DATABASE_URL from .env to ensure it's available for Prisma CLI
const envPath = path.join(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const match = line.trim().match(/^DATABASE_URL=(.+)$/);
    if (match) {
      let val = match[1].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      process.env.DATABASE_URL = val;
    }
  }
}

const dbUrl = process.env.DATABASE_URL;

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: dbUrl,
  },
});
