import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateFrigorificoDto } from './dto/create-frigorifico.dto';
import { UpdateFrigorificoDto } from './dto/update-frigorifico.dto';

@Injectable()
export class FrigorificoService {
  constructor(private readonly databaseService: DatabaseService) {}

  create(createFrigorificoDto: CreateFrigorificoDto) {
    return 'This action adds a new frigorifico';
  }

  findAll() {
    return `This action returns all frigorifico`;
  }

  findOne(id: number) {
    return `This action returns a #${id} frigorifico`;
  }

  update(id: number, updateFrigorificoDto: UpdateFrigorificoDto) {
    return `This action updates a #${id} frigorifico`;
  }

  remove(id: number) {
    return `This action removes a #${id} frigorifico`;
  }

  async createProducto(createProductoDto: any) {
    // Asegurarse de que no se envíe id_producto
    const { id_producto, ...data } = createProductoDto;

    // Convertir tipos de datos según el schema de Prisma
    const processedData = {
      nombre_producto: data.nombre_producto,
      descripcion_producto: data.descripcion_producto || null,
      peso_nominal_g: parseInt(data.peso_nominal_g),
      precio_venta: data.precio_venta.toString(), // Mantener como string para Decimal
      dias_vencimiento: parseInt(data.dias_vencimiento),
      precio_frigorifico: data.precio_frigorifico.toString(), // Mantener como string para Decimal
    };

    return this.databaseService.pRODUCTOS.create({
      data: processedData,
    });
  }

  async findAllProductos() {
    return this.databaseService.pRODUCTOS.findMany({
      select: {
        id_producto: true,
        nombre_producto: true,
        descripcion_producto: true,
        peso_nominal_g: true,
        precio_venta: true,
        dias_vencimiento: true,
        precio_frigorifico: true,
      },
    });
  }

  async updateProducto(id: number, updateProductoDto: any) {
    return this.databaseService.pRODUCTOS.update({
      where: { id_producto: id },
      data: updateProductoDto,
    });
  }

  async removeProducto(id: number) {
    return this.databaseService.pRODUCTOS.delete({
      where: { id_producto: id },
    });
  }
}
