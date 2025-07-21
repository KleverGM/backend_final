import { Test, TestingModule } from '@nestjs/testing';
import { MotorcyclesController } from './motorcycles.controller';

describe('MotorcyclesController', () => {
  let controller: MotorcyclesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MotorcyclesController],
    }).compile();

    controller = module.get<MotorcyclesController>(MotorcyclesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
