import { Module } from '@nestjs/common';
import { RegistrationTokensService } from './registration-tokens.service';
import { RegistrationTokensController } from './registration-tokens.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [RegistrationTokensController],
  providers: [RegistrationTokensService],
  exports: [RegistrationTokensService],
})
export class RegistrationTokensModule {}
