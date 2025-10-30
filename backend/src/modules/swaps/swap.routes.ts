import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { handleCreateSwapRequest, handleListRequests, handleListSwappableSlots, handleSwapResponse, handleSwapHistory, handleCancelSwap } from "./swap.controller";

export const swapRouter = Router();

swapRouter.use(requireAuth);

// GET /api/swappable-slots
swapRouter.get("/swappable-slots", handleListSwappableSlots);

// POST /api/swap-request
swapRouter.post("/swap-request", handleCreateSwapRequest);

// POST /api/swap-response/:requestId
swapRouter.post("/swap-response/:requestId", handleSwapResponse);

// POST /api/swap-cancel/:requestId (requester only)
swapRouter.post("/swap-cancel/:requestId", handleCancelSwap);

// GET /api/requests (incoming/outgoing)
swapRouter.get("/requests", handleListRequests);

// GET /api/swap-history (audit)
swapRouter.get("/swap-history", handleSwapHistory);


