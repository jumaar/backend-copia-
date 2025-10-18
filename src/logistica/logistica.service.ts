import { Injectable } from '@nestjs/common';
import { CreateLogisticaDto } from './dto/create-logistica.dto';
import { UpdateLogisticaDto } from './dto/update-logistica.dto';

@Injectable()
export class LogisticaService {
  create(createLogisticaDto: CreateLogisticaDto) {
    return 'This action adds a new logistica';
  }

  findAll() {
    return `This action returns all logistica`;
  }

  findOne(id: number) {
    return `This action returns a #${id} logistica`;
  }

  update(id: number, updateLogisticaDto: UpdateLogisticaDto) {
    return `This action updates a #${id} logistica`;
  }

  remove(id: number) {
    return `This action removes a #${id} logistica`;
  }
}
