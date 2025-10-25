import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
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

  @Post()
  @Roles(1, 2)
  create(@Body() createFrigorificoDto: CreateFrigorificoDto) {
    return this.frigorificoService.create(createFrigorificoDto);
  }

  @Post('productos')
  @Roles(1, 2)
  async createProducto(@Body() createProductoDto: any) {
    return this.frigorificoService.createProducto(createProductoDto);
  }

  @Get('productos')
  @Roles(1, 2, 3, 4)
  async findAllProductos() {
    return this.frigorificoService.findAllProductos();
  }

  @Patch('productos/:id')
  @Roles(1, 2)
  async updateProducto(@Param('id') id: string, @Body() updateProductoDto: any) {
    return this.frigorificoService.updateProducto(+id, updateProductoDto);
  }

  @Delete('productos/:id')
  @Roles(1, 2)
  async removeProducto(@Param('id') id: string) {
    return this.frigorificoService.removeProducto(+id);
  }

  @Get()
  findAll() {
    return this.frigorificoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.frigorificoService.findOne(+id);
  }

  @Patch(':id')
  @Roles(1, 2)
  update(@Param('id') id: string, @Body() updateFrigorificoDto: UpdateFrigorificoDto) {
    return this.frigorificoService.update(+id, updateFrigorificoDto);
  }

  @Delete(':id')
  @Roles(1, 2)
  remove(@Param('id') id: string) {
    return this.frigorificoService.remove(+id);
  }
}
