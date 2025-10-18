import { Injectable } from '@nestjs/common';
import { CreateFrigorificoDto } from './dto/create-frigorifico.dto';
import { UpdateFrigorificoDto } from './dto/update-frigorifico.dto';

@Injectable()
export class FrigorificoService {
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
}
