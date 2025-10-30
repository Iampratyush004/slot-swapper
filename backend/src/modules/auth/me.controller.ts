import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { prisma } from "../../config/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  password: z.string().min(6).optional(),
});

export async function handleGetMe(req: AuthRequest, res: Response) {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { id: true, name: true, email: true, createdAt: true } });
  res.json(user);
}

export async function handleUpdateMe(req: AuthRequest, res: Response) {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const data: any = {};
  if (parsed.data.name) data.name = parsed.data.name;
  if (parsed.data.password) data.password = await bcrypt.hash(parsed.data.password, 10);
  const user = await prisma.user.update({ where: { id: req.user!.id }, data, select: { id: true, name: true, email: true } });
  res.json(user);
}




