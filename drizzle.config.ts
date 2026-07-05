import { defineConfig } from "drizzle-kit";
import path from "node:path";

const dataDir = process.env.DATA_DIR ?? "./data";

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: path.join(dataDir, "claqueta.db"),
  },
});
