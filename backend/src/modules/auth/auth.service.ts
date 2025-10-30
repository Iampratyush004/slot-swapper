import { prisma } from "../../config/prisma";
import bcrypt from "bcryptjs";
import { signToken } from "../../config/jwt";

export async function signup(name: string, email: string, password: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("Email already in use");
  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { name, email, password: hash } });
  const token = signToken({ userId: user.id });
  return { token, user: { id: user.id, name: user.name, email: user.email } };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("Invalid credentials");
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error("Invalid credentials");
  const token = signToken({ userId: user.id });
  return { token, user: { id: user.id, name: user.name, email: user.email } };
}


