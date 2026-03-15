import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { TiendasService } from './tiendas.service';
import { CreateTiendaDto } from './dto/create-tienda.dto';
import { UpdateTiendaDto } from './dto/update-tienda.dto';
import { CreateNeveraDto } from './dto/create-nevera.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

interface RequestWithUser extends Request {
  user: {
    id_usuario: number;
    roleId: number;
  };
}

@Controller('api/tiendas')
export class TiendasController {
  constructor(private readonly tiendasService: TiendasService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createTiendaDto: CreateTiendaDto, @Req() req) {
    const id_usuario = req.user.id_usuario;
    return this.tiendasService.create(createTiendaDto, id_usuario);
  }
  
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string, @Req() req) {
    const id_usuario = req.user.id_usuario;
    return this.tiendasService.getTiendasByUsuario(id_usuario);
  }
  
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateTiendaDto: UpdateTiendaDto, @Req() req) {
    const id_usuario = req.user.id_usuario;
    return this.tiendasService.update(+id, updateTiendaDto, id_usuario);
  }
  
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Req() req) {
    const id_usuario = req.user.id_usuario;
    return this.tiendasService.remove(+id, id_usuario);
  }

  @Post('neveras')
  @UseGuards(JwtAuthGuard)
  createNevera(@Body() createNeveraDto: CreateNeveraDto, @Req() req) {
    const id_usuario = req.user.id_usuario;
    return this.tiendasService.createNevera(createNeveraDto, id_usuario);
  }
  
  @Get('neveras/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1, 2, 4, 5)
  getProductosByNevera(@Param('id') id: string, @Req() req) {
    const id_usuario = req.user.id_usuario;
    return this.tiendasService.getProductosByNevera(+id, id_usuario);
  }
  
  @Patch('neveras/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(1, 2, 4, 5)
  updateStocksByNevera(@Param('id') id: string, @Body() stockUpdates: any[], @Req() req) {
    const id_usuario = req.user.id_usuario;
    return this.tiendasService.updateStocksByNevera(+id, stockUpdates, id_usuario);
  }
  
  @Delete('neveras/:id')
  @UseGuards(JwtAuthGuard)
  removeNevera(@Param('id') id: string) {
    return this.tiendasService.removeNevera(+id);
  }

  @Get('sobrinas/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(2,4)
  getSobrinas(@Param('id') id: string, @Req() req: RequestWithUser) {
    const rol_usuario = req.user.roleId;
    const id_param = parseInt(id, 10);
      return this.tiendasService.getTiendasSobrinas(id_param, rol_usuario);
    }
  }


