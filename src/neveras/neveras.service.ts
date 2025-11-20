import { Injectable, Logger } from '@nestjs/common';
import { CreateNeveraDto } from './dto/create-nevera.dto';
import { UpdateNeveraDto } from './dto/update-nevera.dto';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class NeverasService {
  private readonly logger = new Logger(NeverasService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async countActiveNeveras(): Promise<{ count: number }> {
    this.logger.debug('Iniciando conteo de neveras activas');
    const count = await this.databaseService.nEVERAS.count({
      where: {
        id_estado_nevera: 2,
      },
    });
    this.logger.debug(`Conteo resultante: ${count}`);
    return { count };
  }

  create(createNeveraDto: CreateNeveraDto) {
    return 'This action adds a new nevera';
  }

  findAll() {
    return `This action returns all neveras`;
  }

  findOne(id: number) {
    return `This action returns a #${id} nevera`;
  }

  update(id: number, updateNeveraDto: UpdateNeveraDto) {
    return `This action updates a #${id} nevera`;
  }

  async remove(id: number) {
    // Verificar si la nevera tiene empaques asociados
    const empaques = await this.databaseService.eMPAQUES.findMany({
      where: {
        id_nevera: id
      }
    });

    if (empaques.length > 0) {
      throw new Error('No se puede eliminar la nevera porque tiene empaques asociados');
    }

    // Si no tiene empaques, proceder con la eliminación
    const neveraEliminada = await this.databaseService.nEVERAS.delete({
      where: {
        id_nevera: id
      }
    });

    return {
      message: 'Nevera eliminada exitosamente',
      nevera: {
        id_nevera: neveraEliminada.id_nevera
      }
    };
  }
}
