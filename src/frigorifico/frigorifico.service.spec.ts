import { Test, TestingModule } from '@nestjs/testing';
import { FrigorificoService } from './frigorifico.service';

describe('FrigorificoService', () => {
  let service: FrigorificoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FrigorificoService],
    }).compile();

    service = module.get<FrigorificoService>(FrigorificoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
