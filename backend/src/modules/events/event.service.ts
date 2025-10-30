import { prisma } from "../../config/prisma";
import { EventInput } from "./event.types";

export async function listMyEvents(userId: string) {
  return prisma.event.findMany({ where: { ownerId: userId }, orderBy: { startTime: "asc" } });
}

export async function createEvent(userId: string, input: EventInput) {
  return prisma.event.create({
    data: {
      title: input.title,
      startTime: new Date(input.startTime),
      endTime: new Date(input.endTime),
      status: input.status ?? "BUSY",
      ownerId: userId,
    },
  });
}

export async function updateEvent(userId: string, id: string, input: Partial<EventInput>) {
  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing || existing.ownerId !== userId) throw new Error("Not found");
  return prisma.event.update({
    where: { id },
    data: {
      title: input.title ?? existing.title,
      startTime: input.startTime ? new Date(input.startTime) : existing.startTime,
      endTime: input.endTime ? new Date(input.endTime) : existing.endTime,
      status: (input as any).status ?? existing.status,
    },
  });
}

export async function deleteEvent(userId: string, id: string) {
  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing || existing.ownerId !== userId) throw new Error("Not found");
  await prisma.event.delete({ where: { id } });
}

export async function listSwappableForOthers(userId: string) {
  return prisma.event.findMany({
    where: { status: "SWAPPABLE", NOT: { ownerId: userId } },
    orderBy: { startTime: "asc" },
    include: { owner: { select: { id: true, name: true, email: true } } },
  });
}


