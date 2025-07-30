import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-http";
import { neon, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");

neonConfig.webSocketConstructor = ws;

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle({ client: sql });
