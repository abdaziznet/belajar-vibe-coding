import { Elysia } from "elysia";
import { getDb } from "./src/db/index";
import { users } from "./src/db/schema";

const app = new Elysia()
  .get("/", () => "Hello, Elysia! This project is set up with Bun, Elysia, Drizzle, and MySQL.")
  .get("/users", async () => {
    try {
      const db = await getDb();
      const allUsers = await db.select().from(users);
      return allUsers;
    } catch (error) {
      return { error: "Could not fetch users. Make sure your database is connected." };
    }
  })
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);