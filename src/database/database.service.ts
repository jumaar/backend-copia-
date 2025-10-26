import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);

  // Esta función asegura que nos conectemos a la base de datos
  // en cuanto la aplicación se inicie.
  async onModuleInit() {
    try {
      this.logger.log('Intentando conectar a la base de datos...');
      await this.$connect();
      this.logger.log('Conexión a la base de datos exitosa');
    } catch (error) {
      this.logger.error('Error al conectar a la base de datos:', error);
      throw error;
    }
  }
}