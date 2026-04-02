import { Elysia, t } from "elysia";
import { createUser, loginUser, logoutUser } from "../services/users-service";
import { authMiddleware } from "../middlewares/auth";

export const usersRoute = new Elysia({ prefix: "/api/users" })
  .post("/", async ({ body }) => {
    const { name, email, password } = body;
    
    // Create the user directly (error handling is in service + global loader)
    const newUser = await createUser({ name, email, password });
    
    return {
      message: "User created successfully",
      data: newUser
    };
  }, {
    body: t.Object({
      name: t.String({ minLength: 1, error: "Name is required" }),
      email: t.String({ format: "email", error: "Invalid email format" }),
      password: t.String({ minLength: 8, error: "Password must be at least 8 characters long" })
    })
  })
  .post("/login", async ({ body, set }) => {
    const { email, password } = body;
    
    const token = await loginUser(email, password);
    
    if (!token) {
      set.status = 400;
      return {
        message: "Email atau password salah",
        error: "INVALID_CREDENTIALS"
      };
    }
    
    return {
      message: "User logged in successfully",
      data: token
    };
  }, {
    body: t.Object({
      email: t.String({ format: "email", error: "Invalid email format" }),
      password: t.String({ minLength: 1, error: "Password is required" })
    })
  })
  // Middleware applied to subsequent routes
  .use(authMiddleware)
  .get("/me", async ({ user }) => {
    return {
      data: user
    };
  })
  .delete("/logout", async ({ token }) => {
    await logoutUser(token);
    
    return {
      data: "User logged out successfully"
    };
  });
