import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  }

  async onModuleInit() {
    // Serverless (Vercel): tek client örneği; her istekte yeniden bağlanma maliyetini azaltır.
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = this;
    }
    await this.$connect();
  }
}
