import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { z } from "zod";
import { createSwapRequest, listRequests, respondToSwap, cancelSwap } from "./swap.service";
import { handleListSwappable } from "../events/event.controller";
import { prisma } from "../../config/prisma";

const requestSchema = z.object({
  mySlotId: z.string().min(1),
  theirSlotId: z.string().min(1),
});

export async function handleListSwappableSlots(req: AuthRequest, res: Response) {
  return handleListSwappable(req, res);
}

export async function handleCreateSwapRequest(req: AuthRequest, res: Response) {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    const created = await createSwapRequest(req.user!.id, parsed.data.mySlotId, parsed.data.theirSlotId);
    res.status(201).json(created);
  } catch (e: any) {
    res.status(400).json({ error: e.message || "Cannot create request" });
  }
}

export async function handleSwapResponse(req: AuthRequest, res: Response) {
  // Be robust to strings like "true"/"false"
  const raw = req.body.accept;
  const accept = raw === true || raw === "true";
  try {
    const result = await respondToSwap(req.user!.id, req.params.requestId, accept);
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ error: e.message || "Cannot respond" });
  }
}

export async function handleListRequests(req: AuthRequest, res: Response) {
  const data = await listRequests(req.user!.id);
  res.json(data);
}

export async function handleSwapHistory(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  const items = await prisma.swapHistory.findMany({
    where: { OR: [{ requesterId: userId }, { responderId: userId }] },
    orderBy: { decidedAt: "desc" },
  });
  const userIds = Array.from(new Set(items.flatMap(h => [h.requesterId, h.responderId])));
  const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true } });
  const idToUser = new Map(users.map(u => [u.id, u]));
  const shaped = items.map(h => {
    const isRequester = h.requesterId === userId;
    const counterpartyId = isRequester ? h.responderId : h.requesterId;
    const u = idToUser.get(counterpartyId);
    return {
      id: h.id,
      status: h.status,
      mySlotId: h.mySlotId,
      theirSlotId: h.theirSlotId,
      mySlotTitle: h.mySlotTitle,
      theirSlotTitle: h.theirSlotTitle,
      decidedAt: h.decidedAt,
      counterparty: u ? { id: u.id, name: u.name, email: u.email } : null,
      role: isRequester ? "REQUESTER" : "RESPONDER",
    };
  });
  res.json(shaped);
}

export async function handleCancelSwap(req: AuthRequest, res: Response) {
  try {
    const result = await cancelSwap(req.user!.id, req.params.requestId);
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ error: e.message || "Cannot cancel" });
  }
}


