import { PrismaClient, Prisma } from "@prisma/client";

export type PrismaTx = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use"> & {
  $transaction: PrismaClient["$transaction"];
};

export class UnitOfWorkFactory {
  constructor(private prisma: PrismaClient) {}

  async withTransaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => fn(tx));
  }
}




