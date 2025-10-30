import { Request, Response } from "express";
import { login, signup } from "./auth.service";
import { z } from "zod";

const signupSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function handleSignup(req: Request, res: Response) {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    const result = await signup(parsed.data.name, parsed.data.email, parsed.data.password);
    res.status(201).json(result);
  } catch (e: any) {
    res.status(400).json({ error: e.message || "Signup failed" });
  }
}

export async function handleLogin(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    const result = await login(parsed.data.email, parsed.data.password);
    res.json(result);
  } catch (e: any) {
    res.status(401).json({ error: e.message || "Login failed" });
  }
}


