import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationDto } from '../../common/pagination/pagination.dto';

export class QueryInvestmentDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  investmentType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;
}
