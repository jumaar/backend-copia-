import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { EmpaquesService } from './empaques.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('api/empaques')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmpaquesController {
  constructor(private readonly empaquesService: EmpaquesService) {}

  @Get(':idOrEpc')
  @Roles(1, 2, 3, 4, 5)
  findOne(@Param('idOrEpc') idOrEpc: string) {
    const numericId = Number(idOrEpc);
    if (!isNaN(numericId)) {
      return this.empaquesService.findById(numericId);
    }
    return this.empaquesService.findByEpc(idOrEpc);
  }
}
