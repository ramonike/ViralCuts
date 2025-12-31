import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

console.log("Testing database connection...");
const dbUrl = process.env.DATABASE_URL;
console.log("DATABASE_URL:", dbUrl ? dbUrl.replace(/:[^:@]*@/, ":****@") : "Undefined");

const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Testing Prisma connection...");
        
        // Test connection with a simple query
        await prisma.$queryRaw`SELECT 1`;
        console.log("✓ Database connection successful!");

        // List tables using raw query
        console.log("\nListing tables in public schema...");
        const result = await prisma.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname = 'public';`;
        console.log("Tables found:", result.map(r => r.tablename));

        if (result.length === 0) {
            console.log("WARNING: No tables found! Did you run prisma db push?");
        }

        await prisma.$disconnect();
        process.exit(0);
    } catch (error) {
        console.error("Database error message:", error.message);
        console.error("Full error:", error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

main();
