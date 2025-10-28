import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { User } from '../auth/entities/user.entity';

interface RequestWithUser extends Request {
  user: {
    id_usuario: number;
    roleId: number;
  };
}
import { FrigorificoService } from './frigorifico.service';
import { CreateFrigorificoDto } from './dto/create-frigorifico.dto';
import { UpdateFrigorificoDto } from './dto/update-frigorifico.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('api/frigorifico')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FrigorificoController {
  constructor(private readonly frigorificoService: FrigorificoService) {}

  @Get()
  @Roles(1, 2, 3, 4)
  findAll(@Req() req: RequestWithUser) {
    const user = req.user;
    return this.frigorificoService.findAll(user.id_usuario);
  }
  
  @Post()
  @Roles(3)
  create(@Req() req: RequestWithUser, @Body() createFrigorificoDto: CreateFrigorificoDto) {
    return this.frigorificoService.create(req.user.id_usuario, createFrigorificoDto);
  }

  @Patch()
  @Roles(3)
  update(@Req() req: RequestWithUser, @Body() updateFrigorificoDto: UpdateFrigorificoDto) {
    return this.frigorificoService.update(req.user.id_usuario, updateFrigorificoDto);
  }

  @Delete()
  @Roles(3)
  remove(@Req() req: RequestWithUser, @Body() body: { id_frigorifico: number }) {
    return this.frigorificoService.remove(req.user.id_usuario, body.id_frigorifico);
  }

  @Post('productos')
  @Roles(1, 2)
  async createProducto(@Req() req: RequestWithUser, @Body() createProductoDto: any) {
    return this.frigorificoService.createProducto(createProductoDto, req.user.id_usuario);
  }

  @Get('productos')
  @Roles(1, 2, 3, 4)
  async findAllProductos(@Req() req: RequestWithUser) {
    return this.frigorificoService.findAllProductos(req.user.id_usuario);
  }

  @Patch('productos/:id')
  @Roles(1, 2)
  async updateProducto(@Req() req: RequestWithUser, @Param('id') id: string, @Body() updateProductoDto: any) {
    return this.frigorificoService.updateProducto(+id, updateProductoDto, req.user.id_usuario);
  }

  @Delete('productos/:id')
  @Roles(1, 2)
  async removeProducto(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.frigorificoService.removeProducto(+id, req.user.id_usuario);
  }

  @Post('estacion/:frigorificoId')
  @Roles(3)
  createEstacion(@Param('frigorificoId') frigorificoId: string, @Req() req: RequestWithUser) {
    return this.frigorificoService.createEstacion(+frigorificoId, req.user.id_usuario);
  }

  @Delete('estacion/:estacionId')
  @Roles(3)
  deleteEstacion(@Param('estacionId') estacionId: string, @Req() req: RequestWithUser) {
    return this.frigorificoService.deleteEstacion(estacionId, req.user.id_usuario);
  }

}