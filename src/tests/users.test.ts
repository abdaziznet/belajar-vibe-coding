import { describe, expect, it, mock } from "bun:test";
import { app } from "../../index";
import { AuthError, DuplicateEmailError } from "../utils/errors";

describe("User Registration API", () => {
  it("should register a user successfully", async () => {
    mock.module("../services/users-service", () => {
      return {
        createUser: async (userData: any) => {
          return {
            id: 2,
            name: userData.name,
            email: userData.email,
            createdAt: new Date().toISOString()
          };
        }
      };
    });

    const response = await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "John Doe",
          email: "john@example.com",
          password: "password123"
        })
      })
    );

    const result = await response.json() as any;
    expect(response.status).toBe(200);
    expect(result.message).toBe("User created successfully");
    expect(result.data.email).toBe("john@example.com");
  });

  it("should fail if email is already registered", async () => {
    mock.module("../services/users-service", () => {
      return {
        createUser: async () => {
          throw new DuplicateEmailError();
        }
      };
    });

    const response = await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Existing",
          email: "existing@example.com",
          password: "password123"
        })
      })
    );

    const result = await response.json() as any;
    expect(response.status).toBe(400);
    expect(result.error).toBe("DUPLICATE_EMAIL");
  });

  it("should fail validation for short password", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test",
          email: "test@example.com",
          password: "123"
        })
      })
    );

    expect(response.status).toBe(422);
  });

  describe("Login", () => {
    it("should login successfully with valid credentials", async () => {
      mock.module("../services/users-service", () => {
        return {
          loginUser: async (email: string, password: any) => {
            if (email === "john@example.com" && password === "password123") {
              return "mocked-uuid-token";
            }
            return null;
          }
        };
      });

      const response = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "john@example.com",
            password: "password123"
          })
        })
      );

      const result = await response.json() as any;
      expect(response.status).toBe(200);
      expect(result.message).toBe("User logged in successfully");
      expect(result.data).toBe("mocked-uuid-token");
    });

    it("should fail login with invalid credentials", async () => {
       const response = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "john@example.com",
            password: "wrong-password"
          })
        })
      );

      const result = await response.json() as any;
      expect(response.status).toBe(400);
      expect(result.error).toBe("INVALID_CREDENTIALS");
    });
  });

  describe("Protected Routes (Auth Middleware)", () => {
    it("should return user profile with valid token", async () => {
      mock.module("../services/users-service", () => {
        return {
          getUserByToken: async (token: string) => {
            if (token === "valid-token") {
              return {
                id: 1,
                name: "John Doe",
                email: "john@example.com",
                createdAt: new Date().toISOString()
              };
            }
            return null;
          }
        };
      });

      const response = await app.handle(
        new Request("http://localhost/api/users/me", {
          method: "GET",
          headers: { 
            "Authorization": "Bearer valid-token" 
          }
        })
      );

      const result = await response.json() as any;
      expect(response.status).toBe(200);
      expect(result.data.email).toBe("john@example.com");
    });

    it("should fail with missing authorization header", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/me", {
          method: "GET"
        })
      );

      const result = await response.json() as any;
      expect(response.status).toBe(400);
      expect(result.error).toBe("INVALID_TOKEN");
    });

    it("should logout successfully", async () => {
        mock.module("../services/users-service", () => {
          return {
            getUserByToken: async (token: string) => {
              if (token === "valid-token") return { id: 1 };
              return null;
            },
            logoutUser: async () => {}
          };
        });

      const response = await app.handle(
        new Request("http://localhost/api/users/logout", {
          method: "DELETE",
          headers: { 
            "Authorization": "Bearer valid-token" 
          }
        })
      );

      const result = await response.json() as any;
      expect(response.status).toBe(200);
      expect(result.data).toBe("User logged out successfully");
    });
  });
});
