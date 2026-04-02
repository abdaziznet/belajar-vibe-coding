import { Elysia, t } from "elysia";
import { createUser, findUserByEmail } from "../services/users-service";

export const usersRoute = new Elysia({ prefix: "/api/users" })
  .post("/", async ({ body, set }) => {
    try {
      const { name, email, password } = body;
      
      // 1. Basic format validation (already handled by Elysia schema)
      
      // 2. Business Logic: Check if email exists
      const existingUser = await findUserByEmail(email);
      if (existingUser) {
        set.status = 400;
        return {
          message: "Email already registered",
          error: "DUPLICATE_EMAIL"
        };
      }
      
      // 3. Create the user
      const newUser = await createUser({ name, email, password });
      
      if (!newUser) {
        set.status = 500;
        return {
          message: "Could not create user",
          error: "INTERNAL_SERVER_ERROR"
        };
      }
      
      return {
        message: "User created successfully",
        data: newUser
      };
      
    } catch (error: any) {
      set.status = 400;
      return {
        message: error.message || "An error occurred",
        error: "BAD_REQUEST"
      };
    }
  }, {
    body: t.Object({
      name: t.String({ minLength: 1, error: "Name is required" }),
      email: t.String({ format: "email", error: "Invalid email format" }),
      password: t.String({ minLength: 8, error: "Password must be at least 8 characters long" })
    })
  });
