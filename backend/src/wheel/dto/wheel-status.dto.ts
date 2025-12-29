import { ApiProperty } from '@nestjs/swagger';
import { WheelRewardType } from '@prisma/client';

export class LastSpinDto {
  @ApiProperty({ example: 'points' })
  rewardType: WheelRewardType;

  @ApiProperty({ example: '25' })
  rewardValue: string;

  @ApiProperty({ example: '2025-12-14T15:30:00Z' })
  spunAt: Date;
}

export class WheelStatusResponseDto {
  @ApiProperty({ example: true })
  canSpin: boolean;

  @ApiProperty({ example: 1 })
  spinRights: number;

  @ApiProperty({ example: 50 })
  weekNumber: number;

  @ApiProperty({ example: 2025 })
  year: number;

  @ApiProperty({ type: LastSpinDto, required: false })
  lastSpin?: LastSpinDto;

  @ApiProperty({ example: '2025-12-16T00:00:00Z', required: false })
  nextSpinAvailable?: Date;
}
