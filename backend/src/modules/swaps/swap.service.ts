import { prisma } from "../../config/prisma";
import { UnitOfWorkFactory } from "../../infra/uow";
import { SwapRepo } from "./swap.repo";
import { EventRepo } from "../events/event.repo";

export async function listRequests(userId: string) {
  const repo = new SwapRepo(prisma);
  const [incoming, outgoing] = await Promise.all([
    repo.listIncoming(userId),
    repo.listOutgoing(userId),
  ]);
  return { incoming, outgoing };
}

const uow = new UnitOfWorkFactory(prisma);

export async function createSwapRequest(userId: string, mySlotId: string, theirSlotId: string) {
  return uow.withTransaction(async (tx) => {
    const swaps = new SwapRepo(tx);
    const events = new EventRepo(tx);
    const my = await events.findById(mySlotId);
    const their = await events.findById(theirSlotId);
    if (!my || !their) throw new Error("Slots not found");
    if (my.ownerId !== userId) throw new Error("Forbidden");
    if (my.status !== "SWAPPABLE" || their.status !== "SWAPPABLE") throw new Error("Slots must be SWAPPABLE");
    if (their.ownerId === userId) throw new Error("Cannot request your own slot");

    const request = await swaps.create({
      requesterId: userId,
      responderId: their.ownerId,
      mySlotId: my.id,
      theirSlotId: their.id,
      status: "PENDING",
    });
    await events.updateStatus(my.id, "SWAP_PENDING");
    await events.updateStatus(their.id, "SWAP_PENDING");
    return request;
  });
}

export async function respondToSwap(userId: string, requestId: string, accept: boolean) {
  return uow.withTransaction(async (tx) => {
    const swaps = new SwapRepo(tx);
    const events = new EventRepo(tx);
    const req = await swaps.findById(requestId);
    if (!req) throw new Error("Request not found");
    if (req.responderId !== userId) throw new Error("Forbidden");
    if (req.status !== "PENDING") throw new Error("Already handled");

    const my = await events.findById(req.mySlotId);
    const their = await events.findById(req.theirSlotId);
    if (!my || !their) throw new Error("Slots not found");

    if (!accept) {
      await swaps.setStatus(req.id, "REJECTED");
      await events.updateStatus(my.id, "SWAPPABLE");
      await events.updateStatus(their.id, "SWAPPABLE");
      await swaps.writeHistory({
        requesterId: req.requesterId,
        responderId: req.responderId,
        mySlotId: my.id,
        theirSlotId: their.id,
        mySlotTitle: my.title,
        theirSlotTitle: their.title,
        status: "REJECTED",
      });
      await swaps.delete(req.id);
      return { status: "REJECTED" };
    }

    await swaps.setStatus(req.id, "ACCEPTED");
    await events.exchangeOwners(my.id, req.responderId, their.id, req.requesterId);
    await swaps.writeHistory({
      requesterId: req.requesterId,
      responderId: req.responderId,
      mySlotId: my.id,
      theirSlotId: their.id,
      mySlotTitle: my.title,
      theirSlotTitle: their.title,
      status: "ACCEPTED",
    });
    await swaps.delete(req.id);
    return { status: "ACCEPTED" };
  });
}

export async function cancelSwap(userId: string, requestId: string) {
  return uow.withTransaction(async (tx) => {
    const swaps = new SwapRepo(tx);
    const events = new EventRepo(tx);
    const req = await swaps.findById(requestId);
    if (!req) throw new Error("Request not found");
    if (req.requesterId !== userId) throw new Error("Only the requester can cancel");
    if (req.status !== "PENDING") throw new Error("Cannot cancel after response");
    const my = await events.findById(req.mySlotId);
    const their = await events.findById(req.theirSlotId);
    if (!my || !their) throw new Error("Slots not found");
    await events.updateStatus(my.id, "SWAPPABLE");
    await events.updateStatus(their.id, "SWAPPABLE");
    await swaps.writeHistory({
      requesterId: req.requesterId,
      responderId: req.responderId,
      mySlotId: my.id,
      theirSlotId: their.id,
      mySlotTitle: my.title,
      theirSlotTitle: their.title,
      status: "CANCELLED",
    });
    await swaps.delete(req.id);
    return { status: "CANCELLED" };
  });
}


