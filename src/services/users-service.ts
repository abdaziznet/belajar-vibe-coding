import { getDb } from "../db/index";
import { users, sessions } from "../db/schema";
import { eq, and, gt } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { DuplicateEmailError } from "../utils/errors";

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
  
  try {
    // Insert the new user directly
    await db.insert(users).values({
      name,
      email,
      password: hashedPassword,
    });
  } catch (error: any) {
    // Handle race condition / duplicate email via DB constraint
    if (error.code === 'ER_DUP_ENTRY' || error.message?.includes('Duplicate entry')) {
      throw new DuplicateEmailError();
    }
    throw error;
  }
  
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
  
  // Set expiration to 7 days from now
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await db.insert(sessions).values({
    token,
    userId: user.id,
    expiresAt: expiresAt,
  });
  
  return token;
};

export const getUserByToken = async (token: string) => {
  const db = await getDb();
  
  const now = new Date();
  
  const result = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      createdAt: users.createdAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(
      and(
        eq(sessions.token, token),
        gt(sessions.expiresAt, now) // Token must not be expired
      )
    );
    
  return result[0] || null;
};

export const logoutUser = async (token: string) => {
  const db = await getDb();
  await db.delete(sessions).where(eq(sessions.token, token));
};
