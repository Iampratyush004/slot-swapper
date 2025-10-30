import { Prisma, PrismaClient } from "@prisma/client";

export class EventRepo {
  constructor(private tx: Prisma.TransactionClient | PrismaClient) {}

  findById(id: string) {
    return this.tx.event.findUnique({ where: { id } });
  }

  updateStatus(id: string, status: "BUSY" | "SWAPPABLE" | "SWAP_PENDING") {
    return this.tx.event.update({ where: { id }, data: { status } });
  }

  exchangeOwners(myId: string, newOwnerId: string, theirId: string, otherOwnerId: string) {
    return Promise.all([
      this.tx.event.update({ where: { id: myId }, data: { ownerId: newOwnerId, status: "BUSY" } }),
      this.tx.event.update({ where: { id: theirId }, data: { ownerId: otherOwnerId, status: "BUSY" } }),
    ]);
  }
}




