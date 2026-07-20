import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Investment } from './entities/investment.entity';
import { CreateInvestmentDto } from './dto/create-investment.dto';
import { UpdateInvestmentDto } from './dto/update-investment.dto';
import { QueryInvestmentDto } from './dto/query-investment.dto';

@Injectable()
export class InvestmentsService {
  constructor(
    @InjectRepository(Investment)
    private readonly investmentRepository: Repository<Investment>,
  ) {}

  async create(userId: string, dto: CreateInvestmentDto): Promise<Investment> {
    const investment = this.investmentRepository.create({ ...dto, userId });
    return this.investmentRepository.save(investment);
  }

  async findAll(userId: string, query: QueryInvestmentDto) {
    const { page, limit, investmentType, search } = query;
    const skip = (page - 1) * limit;

    const qb = this.investmentRepository
      .createQueryBuilder('investment')
      .where('investment.userId = :userId', { userId })
      .orderBy('investment.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    if (investmentType) {
      qb.andWhere('investment.investmentType ILIKE :type', {
        type: `%${investmentType}%`,
      });
    }

    if (search) {
      qb.andWhere('investment.investmentName ILIKE :search', {
        search: `%${search}%`,
      });
    }

    const [data, total] = await qb.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: { total, page, limit, totalPages },
    };
  }

  async findOne(userId: string, id: string): Promise<Investment> {
    const investment = await this.investmentRepository.findOne({
      where: { id, userId }, // both conditions — no separate ownership check needed
    });

    if (!investment) {
      // 404 whether it doesn't exist OR belongs to another user — no information leak
      throw new NotFoundException('Investment not found');
    }

    return investment;
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateInvestmentDto,
  ): Promise<Investment> {
    const investment = await this.findOne(userId, id); // ownership enforced here
    Object.assign(investment, dto);
    return this.investmentRepository.save(investment);
  }

  async remove(userId: string, id: string): Promise<void> {
    const investment = await this.findOne(userId, id); // ownership enforced here
    await this.investmentRepository.remove(investment);
  }
}
