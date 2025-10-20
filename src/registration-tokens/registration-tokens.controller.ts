import { Controller, Post, Body, UseGuards, Get, Req } from '@nestjs/common';
import { RegistrationTokensService } from './registration-tokens.service';
import { CreateRegistrationTokenDto } from './dto/create-registration-token.dto';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/registration-tokens')
export class RegistrationTokensController {
  constructor(
    private readonly registrationTokensService: RegistrationTokensService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  create(@Body() createRegistrationTokenDto: CreateRegistrationTokenDto, @Req() req) {
    const creatorId = req.user.sub; // 'sub' es el id_usuario del token JWT
    return this.registrationTokensService.createToken(
      createRegistrationTokenDto,
      creatorId,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  findAll(@Req() req) {
    const creatorId = req.user.sub;
    return this.registrationTokensService.findAllUnused(creatorId);
  }
}
