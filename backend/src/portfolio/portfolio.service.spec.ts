import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PortfolioService } from './portfolio.service';
import { Investment } from '../investments/entities/investment.entity';

const makeQb = (totalInvested: string | null, currentValue: string | null) => ({
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  getRawOne: jest.fn().mockResolvedValue({ totalInvested, currentValue }),
});

const mockRepo = { createQueryBuilder: jest.fn() };

describe('PortfolioService', () => {
  let service: PortfolioService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PortfolioService,
        { provide: getRepositoryToken(Investment), useValue: mockRepo },
      ],
    }).compile();
    service = module.get<PortfolioService>(PortfolioService);
    jest.clearAllMocks();
  });

  it('calculates correct profit and profitPercentage', async () => {
    mockRepo.createQueryBuilder.mockReturnValue(makeQb('50000', '62000'));
    const result = await service.getSummary('user-1');

    expect(result.profit).toBe(12000);
    expect(result.profitPercentage).toBe(24);
  });

  it('returns profitPercentage = 0 (not NaN) when totalInvested = 0', async () => {
    mockRepo.createQueryBuilder.mockReturnValue(makeQb(null, null));
    const result = await service.getSummary('user-1');

    expect(result.totalInvested).toBe(0);
    expect(result.profitPercentage).toBe(0);
    expect(Number.isNaN(result.profitPercentage)).toBe(false);
  });

  it('rounds profitPercentage to 2 decimal places', async () => {
    mockRepo.createQueryBuilder.mockReturnValue(makeQb('30000', '40001'));
    const result = await service.getSummary('user-1');

    expect(result.profitPercentage.toString()).toMatch(/^\d+\.\d{1,2}$/);
  });

  it('handles negative profit (loss scenario)', async () => {
    mockRepo.createQueryBuilder.mockReturnValue(makeQb('10000', '8000'));
    const result = await service.getSummary('user-1');

    expect(result.profit).toBe(-2000);
    expect(result.profitPercentage).toBe(-20);
  });
});
