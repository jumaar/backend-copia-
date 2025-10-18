import { Test, TestingModule } from '@nestjs/testing';
import { LogisticaService } from './logistica.service';

describe('LogisticaService', () => {
  let service: LogisticaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LogisticaService],
    }).compile();

    service = module.get<LogisticaService>(LogisticaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
