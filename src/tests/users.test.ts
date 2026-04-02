import { describe, expect, it, mock } from "bun:test";
import { app } from "../../index";

// Mock the services to avoid real DB connections
mock.module("../services/users-service", () => {
  return {
    findUserByEmail: async (email: string) => {
      if (email === "existing@example.com") {
        return { id: 1, name: "Existing User", email: "existing@example.com" };
      }
      return null;
    },
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

describe("User Registration API", () => {
  it("should register a user successfully", async () => {
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
    expect(result.data).not.toHaveProperty("password");
  });

  it("should fail if email is already registered", async () => {
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
    expect(result.message).toBe("Email already registered");
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

  it("should fail validation for invalid email", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test",
          email: "not-an-email",
          password: "password123"
        })
      })
    );

    expect(response.status).toBe(422);
  });

  describe("Login", () => {
    it("should login successfully with valid credentials", async () => {
      // Stub the service for specific email/password combo
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
       // Using the same mock as above
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

    it("should fail validation for malformed email on login", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "not-an-email",
            password: "password123"
          })
        })
      );

      expect(response.status).toBe(422);
    });
  });

  describe("Get Me", () => {
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
      expect(result.data).not.toHaveProperty("password");
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

    it("should fail with invalid token", async () => {
      const response = await app.handle(
        new Request("http://localhost/api/users/me", {
          method: "GET",
          headers: { 
            "Authorization": "Bearer invalid-token" 
          }
        })
      );

      const result = await response.json() as any;
      expect(response.status).toBe(400);
      expect(result.error).toBe("INVALID_TOKEN");
    });
  });
});
