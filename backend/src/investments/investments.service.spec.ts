import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { InvestmentsService } from './investments.service';
import { Investment } from './entities/investment.entity';

const mockInvestment = {
  id: 'inv-1',
  userId: 'user-1',
  investmentName: 'Apple Inc',
  investmentType: 'Stocks',
  investedAmount: 10000,
  currentValue: 12000,
  purchaseDate: '2024-01-01',
};

const mockRepo = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(),
};

describe('InvestmentsService', () => {
  let service: InvestmentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvestmentsService,
        { provide: getRepositoryToken(Investment), useValue: mockRepo },
      ],
    }).compile();
    service = module.get<InvestmentsService>(InvestmentsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('always uses userId from argument, not from dto', async () => {
      mockRepo.create.mockReturnValue({ ...mockInvestment });
      mockRepo.save.mockResolvedValue(mockInvestment);
      const dto = {
        investmentName: 'Apple',
        investmentType: 'Stocks',
        investedAmount: 1000,
        currentValue: 1200,
        purchaseDate: '2024-01-01',
      };

      await service.create('user-1', dto);

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1' }),
      );
    });
  });

  describe('findAll — pagination math', () => {
    const makeQb = (total: number, data: any[]) => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([data, total]),
    });

    it('calculates correct offset: (page-1) * limit', async () => {
      const qb = makeQb(30, []);
      mockRepo.createQueryBuilder.mockReturnValue(qb);

      await service.findAll('user-1', { page: 3, limit: 10 });

      expect(qb.skip).toHaveBeenCalledWith(20); // (3-1)*10 = 20
    });

    it('calculates totalPages = ceil(total / limit)', async () => {
      const qb = makeQb(25, []);
      mockRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll('user-1', { page: 1, limit: 10 });

      expect(result.meta.totalPages).toBe(3); // ceil(25/10) = 3
    });

    it('returns totalPages = 0 when no investments', async () => {
      const qb = makeQb(0, []);
      mockRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll('user-1', { page: 1, limit: 10 });

      expect(result.meta.totalPages).toBe(0);
    });
  });

  describe('findOne — ownership enforcement', () => {
    it('returns investment when userId matches', async () => {
      mockRepo.findOne.mockResolvedValue(mockInvestment);
      const result = await service.findOne('user-1', 'inv-1');
      expect(result).toEqual(mockInvestment);
      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'inv-1', userId: 'user-1' },
      });
    });

    it('throws NotFoundException when userId does not match (no info leak)', async () => {
      mockRepo.findOne.mockResolvedValue(null); // same result as "not exists"
      await expect(service.findOne('attacker-id', 'inv-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
