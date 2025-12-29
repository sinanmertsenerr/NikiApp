import {
    IsString,
    IsOptional,
    IsEnum,
    IsInt,
    IsDateString,
    IsNumber,
    Min,
    Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { RewardType, RaffleStatus } from '@prisma/client';

export class CreateRaffleDto {
    @ApiProperty({ example: 'New Year Raffle' })
    @IsString()
    title: string;

    @ApiProperty({ example: 'Yılbaşı Çekilişi' })
    @IsString()
    titleTr: string;

    @ApiPropertyOptional({ example: 'Win a free coffee!' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ example: 'Bedava kahve kazanın!' })
    @IsOptional()
    @IsString()
    descriptionTr?: string;

    @ApiProperty({ enum: RewardType, example: 'free_coffee' })
    @IsEnum(RewardType)
    rewardType: RewardType;

    @ApiPropertyOptional({ example: 'Free Coffee', description: 'Reward description (e.g., Free Coffee, 50% Discount)' })
    @IsOptional()
    @IsString()
    rewardValue?: string;

    @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
    @IsDateString()
    startDate: string;

    @ApiProperty({ example: '2025-01-07T23:59:59.000Z' })
    @IsDateString()
    endDate: string;

    @ApiPropertyOptional({ example: 1, description: 'Number of winners' })
    @IsOptional()
    @IsInt()
    @Min(1)
    winnerCount?: number;
}

export class UpdateRaffleDto {
    @ApiPropertyOptional({ example: 'New Year Raffle' })
    @IsOptional()
    @IsString()
    title?: string;

    @ApiPropertyOptional({ example: 'Yılbaşı Çekilişi' })
    @IsOptional()
    @IsString()
    titleTr?: string;

    @ApiPropertyOptional({ example: 'Win a free coffee!' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ example: 'Bedava kahve kazanın!' })
    @IsOptional()
    @IsString()
    descriptionTr?: string;

    @ApiPropertyOptional({ enum: RewardType })
    @IsOptional()
    @IsEnum(RewardType)
    rewardType?: RewardType;

    @ApiPropertyOptional({ example: 'Free Coffee' })
    @IsOptional()
    @IsString()
    rewardValue?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsDateString()
    endDate?: string;

    @ApiPropertyOptional({ example: 1 })
    @IsOptional()
    @IsInt()
    @Min(1)
    winnerCount?: number;

    @ApiPropertyOptional({ enum: RaffleStatus })
    @IsOptional()
    @IsEnum(RaffleStatus)
    status?: RaffleStatus;
}

export class GetRafflesQueryDto {
    @ApiPropertyOptional({ example: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ example: 20 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 20;

    @ApiPropertyOptional({ enum: RaffleStatus })
    @IsOptional()
    @IsEnum(RaffleStatus)
    status?: RaffleStatus;
}

export class DrawRaffleDto {
    @ApiPropertyOptional({ example: 1, description: 'Number of winners to draw (defaults to raffle winnerCount)' })
    @IsOptional()
    @IsInt()
    @Min(1)
    winnerCount?: number;
}
