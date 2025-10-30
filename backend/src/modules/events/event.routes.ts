import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { handleCreateEvent, handleDeleteEvent, handleListMyEvents, handleListSwappable, handleUpdateEvent } from "./event.controller";

export const eventRouter = Router();

eventRouter.use(requireAuth);

eventRouter.get("/", handleListMyEvents);
eventRouter.post("/", handleCreateEvent);
eventRouter.put("/:id", handleUpdateEvent);
eventRouter.delete("/:id", handleDeleteEvent);

// GET /api/events/swappable is fine too, but spec asks /api/swappable-slots
eventRouter.get("/__unused", (_req, res) => res.status(404).send());

// Expose swappable via app mount at /api/swappable-slots
export { handleListSwappable };


