import { Elysia, t } from "elysia";
import { createUser, findUserByEmail, loginUser, getUserByToken, logoutUser } from "../services/users-service";

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
  .get("/me", async ({ headers, set }) => {
    const auth = headers['authorization'];
    
    if (!auth || !auth.startsWith("Bearer ")) {
      set.status = 400;
      return {
        message: "Token tidak valid",
        error: "INVALID_TOKEN"
      };
    }
    
    const token = auth.split(" ")[1];
    if (!token) {
      set.status = 400;
      return {
        message: "Token tidak valid",
        error: "INVALID_TOKEN"
      };
    }
    const user = await getUserByToken(token);
    
    if (!user) {
      set.status = 400;
      return {
        message: "Token tidak valid",
        error: "INVALID_TOKEN"
      };
    }
    
    return {
      data: user
    };
  })
  .delete("/logout", async ({ headers, set }) => {
    const auth = headers['authorization'];
    
    if (!auth || !auth.startsWith("Bearer ")) {
      set.status = 400;
      return {
        message: "Token tidak valid",
        error: "INVALID_TOKEN"
      };
    }
    
    const token = auth.split(" ")[1];
    if (!token) {
      set.status = 400;
      return {
        message: "Token tidak valid",
        error: "INVALID_TOKEN"
      };
    }
    
    const user = await getUserByToken(token);
    if (!user) {
      set.status = 400;
      return {
        message: "Token tidak valid",
        error: "INVALID_TOKEN"
      };
    }
    
    await logoutUser(token);
    
    return {
      data: "User logged out successfully"
    };
  });
