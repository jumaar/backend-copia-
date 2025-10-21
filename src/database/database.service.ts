import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit {
  // Esta función asegura que nos conectemos a la base de datos
  // en cuanto la aplicación se inicie.
  async onModuleInit() {
    await this.$connect();
  }
}