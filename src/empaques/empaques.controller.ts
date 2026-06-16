import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
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
  findOne(@Param('idOrEpc') idOrEpc: string, @Req() req: any) {
    const idAdmin: number = req.user?.idAdmin ?? 0;
    const numericId = Number(idOrEpc);
    if (!isNaN(numericId)) {
      return this.empaquesService.findById(numericId, idAdmin);
    }
    return this.empaquesService.findByEpc(idOrEpc, idAdmin);
  }
}
