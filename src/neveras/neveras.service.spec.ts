import { Test, TestingModule } from '@nestjs/testing';
import { NeverasService } from './neveras.service';

describe('NeverasService', () => {
  let service: NeverasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NeverasService],
    }).compile();

    service = module.get<NeverasService>(NeverasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
