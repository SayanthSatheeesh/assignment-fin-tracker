import {
  IsString,
  IsNumber,
  IsPositive,
  IsDateString,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateInvestmentDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  investmentName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  investmentType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  investedAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  currentValue?: number;

  @IsOptional()
  @IsDateString()
  purchaseDate?: string;
}
