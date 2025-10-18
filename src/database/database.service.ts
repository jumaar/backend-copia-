// import { Injectable, OnModuleInit } from '@nestjs/common';
// import { PrismaClient } from '@prisma/client';

// @Injectable()
// export class DatabaseService extends PrismaClient implements OnModuleInit {
//   // Esta función asegura que nos conectemos a la base de datos
//   // en cuanto la aplicación se inicie.
//   async onModuleInit() {
//     await this.$connect();
//   }
// }

import { Injectable } from '@nestjs/common';

@Injectable()
export class DatabaseService {
  // Servicio de base de datos comentado para usar PostgREST
}