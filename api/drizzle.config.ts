import "dotenv/config";
import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");

export default defineConfig({
    schema: process.env.NODE_ENV === "production" ? "./db/schema.js" : "./src/db/schema.ts",
    dialect: "postgresql",
    dbCredentials: { url: process.env.DATABASE_URL },
    verbose: true,
    strict: true,
});
