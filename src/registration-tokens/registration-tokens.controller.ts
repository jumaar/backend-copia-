import { Controller, Post, Body, UseGuards, Get, Req } from '@nestjs/common';
import { RegistrationTokensService } from './registration-tokens.service';
import { CreateRegistrationTokenDto } from './dto/create-registration-token.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/registration-tokens')
export class RegistrationTokensController {
  constructor(
    private readonly registrationTokensService: RegistrationTokensService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createRegistrationTokenDto: CreateRegistrationTokenDto, @Req() req) {
    // El objeto 'user' ahora contiene id, email, y roleId gracias a nuestra JwtStrategy
    const creator = req.user;
    return this.registrationTokensService.createToken(
      createRegistrationTokenDto,
      creator,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Req() req) {
    const creator = req.user;
    return this.registrationTokensService.findAllUnused(creator.id);
  }
}
