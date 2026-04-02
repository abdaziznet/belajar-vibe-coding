import { getDb } from "../db/index";
import { users, sessions } from "../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const findUserByEmail = async (email: string) => {
  const db = await getDb();
  const result = await db.select().from(users).where(eq(users.email, email));
  return result[0];
};

export const createUser = async (userData: any) => {
  const { name, email, password } = userData;
  const db = await getDb();
  
  // Hash the password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  
  // Insert the new user
  await db.insert(users).values({
    name,
    email,
    password: hashedPassword,
  });
  
  // Fetch and return the created user (without password)
  const newUser = await findUserByEmail(email);
  if (!newUser) return null;
  
  const { password: _, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
};

export const loginUser = async (email: string, password: any) => {
  const user = await findUserByEmail(email);
  if (!user) return null;
  
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) return null;
  
  const token = crypto.randomUUID();
  const db = await getDb();
  await db.insert(sessions).values({
    token,
    userId: user.id,
  });
  
  return token;
};

export const getUserByToken = async (token: string) => {
  const db = await getDb();
  
  const result = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.token, token));
    
  return result[0] || null;
};

export const logoutUser = async (token: string) => {
  const db = await getDb();
  await db.delete(sessions).where(eq(sessions.token, token));
};
