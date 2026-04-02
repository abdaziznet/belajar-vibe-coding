import { Elysia } from "elysia";
import { getDb } from "./src/db/index";
import { users } from "./src/db/schema";
import { usersRoute } from "./src/routes/users-route";
import { AuthError, DuplicateEmailError } from "./src/utils/errors";

export const app = new Elysia()
  .onError(({ code, error, set }) => {
    if (error instanceof AuthError) {
      set.status = 400;
      return {
        message: error.message,
        error: "INVALID_TOKEN"
      };
    }
    
    if (error instanceof DuplicateEmailError) {
      set.status = 400;
      return {
        message: error.message,
        error: "DUPLICATE_EMAIL"
      };
    }
    
    return {
      message: (error as any).message || "Internal Server Error",
      error: code
    };
  })
  .use(usersRoute)
  .get("/", () => "Hello, Elysia! This project is set up with Bun, Elysia, Drizzle, and MySQL.")
  .get("/users", async () => {
    try {
      const db = await getDb();
      const allUsers = await db.select().from(users);
      return allUsers;
    } catch (error) {
      return { error: "Could not fetch users. Make sure your database is connected." };
    }
  });

app.listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);