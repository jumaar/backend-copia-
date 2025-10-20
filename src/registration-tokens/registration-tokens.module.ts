import { Module } from '@nestjs/common';
import { RegistrationTokensService } from './registration-tokens.service';
import { RegistrationTokensController } from './registration-tokens.controller';

@Module({
  controllers: [RegistrationTokensController],
  providers: [RegistrationTokensService],
})
export class RegistrationTokensModule {}
