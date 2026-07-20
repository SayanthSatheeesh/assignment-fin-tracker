import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInvestmentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  investmentName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  investmentType: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  investedAmount: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  currentValue: number;

  @IsDateString()
  purchaseDate: string;
}
