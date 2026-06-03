import { Module } from '@nestjs/common';
import { EmpaquesService } from './empaques.service';
import { EmpaquesController } from './empaques.controller';

@Module({
  controllers: [EmpaquesController],
  providers: [EmpaquesService],
})
export class EmpaquesModule {}
