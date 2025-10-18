import { Test, TestingModule } from '@nestjs/testing';
import { LogisticaController } from './logistica.controller';
import { LogisticaService } from './logistica.service';

describe('LogisticaController', () => {
  let controller: LogisticaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LogisticaController],
      providers: [LogisticaService],
    }).compile();

    controller = module.get<LogisticaController>(LogisticaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
