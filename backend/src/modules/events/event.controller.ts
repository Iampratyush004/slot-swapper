import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import { z } from "zod";
import { createEvent, deleteEvent, listMyEvents, listSwappableForOthers, updateEvent } from "./event.service";

const eventSchema = z.object({
  title: z.string().min(1),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  status: z.enum(["BUSY", "SWAPPABLE", "SWAP_PENDING"]).optional(),
});

export async function handleListMyEvents(req: AuthRequest, res: Response) {
  const items = await listMyEvents(req.user!.id);
  res.json(items);
}

export async function handleCreateEvent(req: AuthRequest, res: Response) {
  const parsed = eventSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const created = await createEvent(req.user!.id, parsed.data);
  res.status(201).json(created);
}

export async function handleUpdateEvent(req: AuthRequest, res: Response) {
  const parsed = eventSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  try {
    const updated = await updateEvent(req.user!.id, req.params.id, parsed.data);
    res.json(updated);
  } catch (e: any) {
    res.status(404).json({ error: e.message || "Not found" });
  }
}

export async function handleDeleteEvent(req: AuthRequest, res: Response) {
  try {
    await deleteEvent(req.user!.id, req.params.id);
    res.status(204).send();
  } catch (e: any) {
    // Map common errors to user-friendly messages
    const code = e?.code || e?.name;
    const msg: string = e?.message || "Unable to delete";
    if (msg === "Not found") {
      return res.status(404).json({ error: "We couldn't find that event." });
    }
    // Prisma foreign key error → event is referenced in swap requests
    if (code === "P2003" || /foreign key/i.test(msg)) {
      return res.status(409).json({ error: "Cannot delete this event because it is part of a swap request. Cancel the request first." });
    }
    return res.status(400).json({ error: "Could not delete this event. Please try again." });
  }
}

export async function handleListSwappable(req: AuthRequest, res: Response) {
  const items = await listSwappableForOthers(req.user!.id);
  res.json(items);
}


