import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { TiendasService } from './tiendas.service';
import { CreateTiendaDto } from './dto/create-tienda.dto';
import { UpdateTiendaDto } from './dto/update-tienda.dto';
import { CreateNeveraDto } from './dto/create-nevera.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { DatabaseService } from '../database/database.service';

@Controller('api/tiendas')
export class TiendasController {
  constructor(
    private readonly tiendasService: TiendasService,
    private readonly databaseService: DatabaseService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createTiendaDto: CreateTiendaDto, @Req() req: any) {
    const id_usuario = req.user.id_usuario;
    return this.tiendasService.create(createTiendaDto, id_usuario);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1, 2, 4, 5)
  getNeverasActivas(@Req() req: any) {
    return this.tiendasService.getNeverasActivas(req.user.id_usuario, req.user.idAdmin);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateTiendaDto: UpdateTiendaDto, @Req() req: any) {
    const id_usuario = req.user.id_usuario;
    return this.tiendasService.update(+id, updateTiendaDto, id_usuario);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Req() req: any) {
    const id_usuario = req.user.id_usuario;
    return this.tiendasService.remove(+id, id_usuario);
  }

  @Post('neveras')
  @UseGuards(JwtAuthGuard)
  createNevera(@Body() createNeveraDto: CreateNeveraDto, @Req() req: any) {
    const id_usuario = req.user.id_usuario;
    return this.tiendasService.createNevera(createNeveraDto, id_usuario);
  }

  @Get('neveras/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1, 2, 4, 5)
  async getProductosByNevera(@Param('id') id: string, @Req() req: any) {
    if (req.user.idAdmin !== 0) {
      const nevera = await this.databaseService.nEVERAS.findUnique({
        where: { id_nevera: Number(id) },
        select: { id_admin: true },
      });
      if (!nevera || nevera.id_admin !== req.user.idAdmin) {
        throw new ForbiddenException('No tienes acceso a esta nevera');
      }
    }
    return this.tiendasService.getProductosByNevera(+id, req.user.id_usuario);
  }

  @Patch('neveras/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1, 2, 4, 5)
  async updateStocksByNevera(@Param('id') id: string, @Body() stockUpdates: any[], @Req() req: any) {
    if (req.user.idAdmin !== 0) {
      const nevera = await this.databaseService.nEVERAS.findUnique({
        where: { id_nevera: Number(id) },
        select: { id_admin: true },
      });
      if (!nevera || nevera.id_admin !== req.user.idAdmin) {
        throw new ForbiddenException('No tienes acceso a esta nevera');
      }
    }
    return this.tiendasService.updateStocksByNevera(+id, stockUpdates, req.user.id_usuario);
  }

  @Delete('neveras/:id')
  @UseGuards(JwtAuthGuard)
  removeNevera(@Param('id') id: string) {
    return this.tiendasService.removeNevera(+id);
  }

  @Get('sobrinas/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1, 2, 4, 5)
  getSobrinas(@Param('id') id: string, @Req() req: any) {
    return this.tiendasService.getTiendasSobrinas(+id, req.user.roleId, req.user.idAdmin);
  }
}
