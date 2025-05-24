import { db } from "../server/db";
import { migrate } from "drizzle-orm/neon-serverless/migrator";

// This will automatically run needed migrations on the database
async function main() {
  console.log("Running migrations...");
  
  try {
    await migrate(db, { migrationsFolder: "drizzle" });
    console.log("Migrations completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

main();