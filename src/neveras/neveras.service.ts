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

  remove(id: number) {
    return `This action removes a #${id} nevera`;
  }
}
