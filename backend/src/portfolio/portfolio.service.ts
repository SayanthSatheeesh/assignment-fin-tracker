import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Investment } from '../investments/entities/investment.entity';

export interface PortfolioSummary {
  totalInvested: number;
  currentValue: number;
  profit: number;
  profitPercentage: number;
}

@Injectable()
export class PortfolioService {
  constructor(
    @InjectRepository(Investment)
    private readonly investmentRepository: Repository<Investment>,
  ) {}

  async getSummary(userId: string): Promise<PortfolioSummary> {
    const result = await this.investmentRepository
      .createQueryBuilder('investment')
      .select('SUM(investment.investedAmount)', 'totalInvested')
      .addSelect('SUM(investment.currentValue)', 'currentValue')
      .where('investment.userId = :userId', { userId })
      .getRawOne<{
        totalInvested: string | null;
        currentValue: string | null;
      }>();

    // PostgreSQL returns numeric SUM as string; parse to float
    const totalInvested = parseFloat(result?.totalInvested ?? '0') || 0;
    const currentValue = parseFloat(result?.currentValue ?? '0') || 0;
    const profit = parseFloat((currentValue - totalInvested).toFixed(2));

    const profitPercentage =
      totalInvested === 0
        ? 0
        : parseFloat(((profit / totalInvested) * 100).toFixed(2));

    return { totalInvested, currentValue, profit, profitPercentage };
  }
}
