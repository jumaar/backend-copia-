import { Test, TestingModule } from '@nestjs/testing';
import { KioskAdminService } from './kiosk-admin.service';

describe('KioskAdminService', () => {
  let service: KioskAdminService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KioskAdminService],
    }).compile();

    service = module.get<KioskAdminService>(KioskAdminService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
