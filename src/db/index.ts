import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

let dbInstance: any = null;

export const getDb = async () => {
  if (!dbInstance) {
    const connection = await mysql.createConnection({
      uri: process.env.DATABASE_URL || "mysql://root:password@localhost:3306/db_name",
    });
    dbInstance = drizzle(connection, { schema, mode: "default" });
  }
  return dbInstance;
};
