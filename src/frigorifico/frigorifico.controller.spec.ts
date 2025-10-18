import { Test, TestingModule } from '@nestjs/testing';
import { FrigorificoController } from './frigorifico.controller';
import { FrigorificoService } from './frigorifico.service';

describe('FrigorificoController', () => {
  let controller: FrigorificoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FrigorificoController],
      providers: [FrigorificoService],
    }).compile();

    controller = module.get<FrigorificoController>(FrigorificoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
