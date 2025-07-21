import { Test, TestingModule } from '@nestjs/testing';
import { MotorcyclesService } from './motorcycles.service';

describe('MotorcyclesService', () => {
  let service: MotorcyclesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MotorcyclesService],
    }).compile();

    service = module.get<MotorcyclesService>(MotorcyclesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
