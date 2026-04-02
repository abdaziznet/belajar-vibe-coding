import { Elysia } from "elysia";
import { getUserByToken } from "../services/users-service";
import { AuthError } from "../utils/errors";

export const authMiddleware = (app: Elysia) =>
  app.derive(async ({ headers }) => {
    const auth = headers["authorization"];

    if (!auth || !auth.startsWith("Bearer ")) {
      throw new AuthError();
    }

    const token = auth.split(" ")[1];
    if (!token) {
       throw new AuthError();
    }

    const user = await getUserByToken(token);
    if (!user) {
      throw new AuthError();
    }

    return {
      user,
      token // Pass the token in case it's needed (e.g., for logout)
    };
  });
