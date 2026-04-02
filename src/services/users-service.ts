import { getDb } from "../db/index";
import { users } from "../db/schema";
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
