import { Test, TestingModule } from '@nestjs/testing';
import { NeverasController } from './neveras.controller';
import { NeverasService } from './neveras.service';

describe('NeverasController', () => {
  let controller: NeverasController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NeverasController],
      providers: [NeverasService],
    }).compile();

    controller = module.get<NeverasController>(NeverasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
