import { ApiProperty } from '@nestjs/swagger';
import { WheelRewardType } from '@prisma/client';

export class SpinResultDto {
  @ApiProperty({ example: 'points', enum: WheelRewardType })
  rewardType: WheelRewardType;

  @ApiProperty({ example: '25' })
  rewardValue: string;

  @ApiProperty({ example: '25 puan kazandınız!' })
  message: string;

  @ApiProperty({ example: '2025-12-15T10:30:00Z' })
  spunAt: Date;
}
