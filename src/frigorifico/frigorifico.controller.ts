import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Logger, Query } from '@nestjs/common';
import { FrigorificoService } from './frigorifico.service';
import { CreateFrigorificoDto } from './dto/create-frigorifico.dto';
import { UpdateFrigorificoDto } from './dto/update-frigorifico.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('api/frigorifico')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FrigorificoController {
  private readonly logger = new Logger(FrigorificoController.name);

  constructor(private readonly frigorificoService: FrigorificoService) {}

  @Get()
  @Roles(1, 2, 3)
  findAll(@Req() req: any) {
    return this.frigorificoService.findAll(req.user.id_usuario);
  }

  @Post()
  @Roles(3)
  create(@Req() req: any, @Body() createFrigorificoDto: CreateFrigorificoDto) {
    return this.frigorificoService.create(req.user.id_usuario, createFrigorificoDto);
  }

  @Patch()
  @Roles(3)
  update(@Req() req: any, @Body() updateFrigorificoDto: UpdateFrigorificoDto) {
    return this.frigorificoService.update(req.user.id_usuario, updateFrigorificoDto);
  }

  @Delete()
  @Roles(3)
  remove(@Req() req: any, @Body() body: { id_frigorifico: number }) {
    return this.frigorificoService.remove(req.user.id_usuario, body.id_frigorifico);
  }

  @Post('productos')
  @Roles(1, 2)
  async createProducto(@Req() req: any, @Body() createProductoDto: any) {
    return this.frigorificoService.createProducto(createProductoDto, req.user.id_usuario);
  }

  @Get('productos')
  @Roles(1, 2, 3, 4)
  async findAllProductos(@Req() req: any) {
    return this.frigorificoService.findAllProductos(req.user.id_usuario);
  }

  @Patch('productos/:id')
  @Roles(1, 2)
  async updateProducto(@Req() req: any, @Param('id') id: string, @Body() updateProductoDto: any) {
    return this.frigorificoService.updateProducto(+id, updateProductoDto, req.user.id_usuario);
  }

  @Delete('productos/:id')
  @Roles(1, 2)
  async removeProducto(@Req() req: any, @Param('id') id: string) {
    return this.frigorificoService.removeProducto(+id, req.user.id_usuario);
  }

  @Post('estacion/:frigorificoId')
  @Roles(3)
  createEstacion(@Param('frigorificoId') frigorificoId: string, @Req() req: any) {
    return this.frigorificoService.createEstacion(+frigorificoId, req.user.id_usuario);
  }

  @Delete('estacion/:estacionId')
  @Roles(3)
  deleteEstacion(@Param('estacionId') estacionId: string, @Req() req: any) {
    return this.frigorificoService.deleteEstacion(estacionId, req.user.id_usuario);
  }

  @Get('estacion/:estacionId')
  @UseGuards(JwtAuthGuard)
  getHistorialEstacion(@Param('estacionId') estacionId: string, @Req() req: any) {
    if (req.user.type !== 'estacion') {
      throw new Error('Acceso denegado: Token no es de tipo estación');
    }
    if (req.user.sub !== estacionId) {
      throw new Error('Acceso denegado: La estación no coincide con el token');
    }
    return this.frigorificoService.getHistorialEstacion(estacionId);
  }

  @Delete('estacion/:estacionId/empaque/:epc')
  @UseGuards(JwtAuthGuard)
  deleteEmpaqueByEpc(
    @Param('estacionId') estacionId: string,
    @Param('epc') epc: string,
    @Req() req: any,
  ) {
    if (req.user?.type === 'estacion') {
      if (req.user.sub !== estacionId) {
        throw new Error('Acceso denegado: La estación no coincide con el token');
      }
    } else if (req.user?.roleId) {
      if (req.user.roleId !== 3) {
        throw new Error('Acceso denegado: Se requiere rol de frigorífico');
      }
    } else {
      throw new Error('Acceso denegado: Token inválido');
    }
    return this.frigorificoService.deleteEmpaqueByEpc(estacionId, epc, req.user?.id_usuario);
  }

  @Get('gestion')
  @Roles(2, 3, 4)
  getGestionFrigorifico(@Query('id_usuario') id_usuario: string, @Query('id_frigorifico') id_frigorifico: string, @Req() req: any) {
    const requesterId = req.user.id_usuario;
    const requesterRole = req.user.roleId;
    const frigorificoId = id_frigorifico ? Number(id_frigorifico) : undefined;

    if (requesterRole === 3) {
      return this.frigorificoService.getGestionFrigorifico(requesterId, frigorificoId);
    }

    const targetId = Number(id_usuario);
    if (!targetId) {
      throw new Error('Se requiere el parámetro id_usuario para usuarios con rol 2 o 4');
    }

    return this.frigorificoService.getGestionFrigorifico(targetId, frigorificoId);
  }

  @Get('hermanos')
  @Roles(1, 2, 4)
  getHermanosFrigorifico(@Req() req: any) {
    return this.frigorificoService.getHermanosFrigorificoPorScope(req.user.id_usuario, req.user.roleId, req.user.idAdmin);
  }

  @Post('empaques/cambiar-estado')
  @Roles(4)
  async empaqueDeUnoaDos(@Req() req: any, @Body() body: { id_estacion: string; id_producto: number; id_logistica: number }) {
    const { id_estacion, id_producto, id_logistica } = body;
    return this.frigorificoService.empaqueDeUnoaDos(id_estacion, id_producto, id_logistica, req.user.id_usuario, req.user.idAdmin);
  }
}
