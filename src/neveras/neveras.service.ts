import { Injectable } from '@nestjs/common';
import { CreateNeveraDto } from './dto/create-nevera.dto';
import { UpdateNeveraDto } from './dto/update-nevera.dto';

@Injectable()
export class NeverasService {
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
