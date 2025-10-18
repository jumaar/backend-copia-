import { Test, TestingModule } from '@nestjs/testing';
import { KioskAdminController } from './kiosk-admin.controller';
import { KioskAdminService } from './kiosk-admin.service';

describe('KioskAdminController', () => {
  let controller: KioskAdminController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KioskAdminController],
      providers: [KioskAdminService],
    }).compile();

    controller = module.get<KioskAdminController>(KioskAdminController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
