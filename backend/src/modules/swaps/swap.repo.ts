import { Prisma, PrismaClient } from "@prisma/client";

export class SwapRepo {
  constructor(private tx: Prisma.TransactionClient | PrismaClient) {}

  findById(id: string) {
    return this.tx.swapRequest.findUnique({ where: { id } });
  }

  create(data: Parameters<PrismaClient["swapRequest"]["create"]>[0]["data"]) {
    return this.tx.swapRequest.create({ data });
  }

  setStatus(id: string, status: "PENDING" | "ACCEPTED" | "REJECTED") {
    return this.tx.swapRequest.update({ where: { id }, data: { status } });
  }

  delete(id: string) {
    return this.tx.swapRequest.delete({ where: { id } });
  }

  listIncoming(userId: string) {
    return this.tx.swapRequest.findMany({ where: { responderId: userId }, orderBy: { createdAt: "desc" }, include: { mySlot: true, theirSlot: true } });
  }

  listOutgoing(userId: string) {
    return this.tx.swapRequest.findMany({ where: { requesterId: userId }, orderBy: { createdAt: "desc" }, include: { mySlot: true, theirSlot: true } });
  }

  // history
  writeHistory(data: Parameters<PrismaClient["swapHistory"]["create"]>[0]["data"]) {
    return this.tx.swapHistory.create({ data });
  }
}




