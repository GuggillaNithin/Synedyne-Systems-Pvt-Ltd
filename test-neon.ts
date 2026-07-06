import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import fs from "fs";
import path from "path";

const envStr = fs.readFileSync(path.join(process.cwd(), ".env"), "utf-8");
const dbUrlMatch = envStr.match(/^DATABASE_URL=(.+)$/m);
let dbUrl = dbUrlMatch ? dbUrlMatch[1].trim() : "";
if (dbUrl.startsWith('"') && dbUrl.endsWith('"')) {
  dbUrl = dbUrl.slice(1, -1);
}
process.env.DATABASE_URL = dbUrl;

neonConfig.webSocketConstructor = ws;

async function test() {
  console.log("URL:", process.env.DATABASE_URL);
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const res = await pool.query("SELECT 1 as val");
    console.log("Success:", res.rows);
  } catch (err) {
    console.error("Error connecting:", err);
  } finally {
    await pool.end();
  }
}

test();
