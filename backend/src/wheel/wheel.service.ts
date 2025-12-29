import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { WheelRewardType } from '@prisma/client';
import { PrismaService } from '../prisma';
import { EventsGateway } from '../events';
import { WheelStatusResponseDto, SpinResultDto } from './dto';

// Wheel segment configuration with probabilities
interface WheelSegment {
  type: WheelRewardType;
  value: string;
  probability: number; // 0-100
  message: string;
  messageTr: string;
}

@Injectable()
export class WheelService {
  // Mystery Box segments configuration
  // Total probability equals 100%
  private readonly wheelSegments: WheelSegment[] = [
    {
      type: WheelRewardType.nothing,
      value: '0',
      probability: 40,
      message: 'Better luck next time!',
      messageTr: 'Bir dahaki sefere!',
    },
    {
      type: WheelRewardType.discount,
      value: '10',
      probability: 10,
      message: 'You won 10% discount!',
      messageTr: '%10 indirim kazandınız!',
    },
    {
      type: WheelRewardType.retry,
      value: '1',
      probability: 10,
      message: 'Try again!',
      messageTr: 'Tekrar dene!',
    },
    {
      type: WheelRewardType.second_drink_discount,
      value: '50',
      probability: 10,
      message: '50% off your 2nd drink!',
      messageTr: '2. içeceğe %50 indirim!',
    },
    {
      type: WheelRewardType.discount,
      value: '20',
      probability: 7,
      message: 'You won 20% discount!',
      messageTr: '%20 indirim kazandınız!',
    },
    {
      type: WheelRewardType.free_cookie,
      value: '1',
      probability: 5,
      message: 'You won a FREE COOKIE!',
      messageTr: 'Ücretsiz kurabiye kazandınız!',
    },
    {
      type: WheelRewardType.discount,
      value: '30',
      probability: 5,
      message: 'You won 30% discount!',
      messageTr: '%30 indirim kazandınız!',
    },
    {
      type: WheelRewardType.free_coffee,
      value: '1',
      probability: 5,
      message: 'You won a FREE COFFEE!',
      messageTr: 'Ücretsiz kahve kazandınız!',
    },
    {
      type: WheelRewardType.coffee_and_cookie,
      value: '1',
      probability: 5,
      message: 'You won Coffee & Cookie!',
      messageTr: 'Kahve ve kurabiye kazandınız!',
    },
    {
      type: WheelRewardType.points,
      value: '1',
      probability: 3,
      message: 'You won 1 point!',
      messageTr: '1 puan kazandınız!',
    },
  ];

  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) { }

  // ==================== GET WHEEL STATUS ====================

  async getStatus(userId: string): Promise<WheelStatusResponseDto> {
    const { weekNumber, year } = this.getCurrentWeekInfo();

    // Get or create wheel spin record for this week
    let wheelSpin = await this.prisma.wheelSpin.findUnique({
      where: {
        userId_weekNumber_year: {
          userId,
          weekNumber,
          year,
        },
      },
    });

    // If no record exists for this week, create one with 1 spin right
    if (!wheelSpin) {
      wheelSpin = await this.prisma.wheelSpin.create({
        data: {
          userId,
          weekNumber,
          year,
          spinRights: 1,
          used: false,
        },
      });
    }

    // TODO: Re-enable after testing
    // const canSpin = !wheelSpin.used && wheelSpin.spinRights > 0;
    const canSpin = true; // TESTING: Always allow spin

    const response: WheelStatusResponseDto = {
      canSpin,
      // spinRights: wheelSpin.used ? 0 : wheelSpin.spinRights,
      spinRights: 1, // TESTING: Always show 1 spin right
      weekNumber,
      year,
    };

    // If already spun this week, include last spin info
    if (wheelSpin.used && wheelSpin.rewardType && wheelSpin.spunAt) {
      response.lastSpin = {
        rewardType: wheelSpin.rewardType,
        rewardValue: wheelSpin.rewardValue || '0',
        spunAt: wheelSpin.spunAt,
      };

      // Calculate next spin available (next Monday 00:00)
      response.nextSpinAvailable = this.getNextMondayDate();
    }

    return response;
  }

  // ==================== SPIN THE WHEEL ====================

  async spin(userId: string): Promise<SpinResultDto> {
    const { weekNumber, year } = this.getCurrentWeekInfo();

    // Get wheel spin record
    let wheelSpin = await this.prisma.wheelSpin.findUnique({
      where: {
        userId_weekNumber_year: {
          userId,
          weekNumber,
          year,
        },
      },
    });

    // Create if doesn't exist
    if (!wheelSpin) {
      wheelSpin = await this.prisma.wheelSpin.create({
        data: {
          userId,
          weekNumber,
          year,
          spinRights: 1,
          used: false,
        },
      });
    }

    // Check if can spin
    // TODO: Re-enable after testing
    // if (wheelSpin.used) {
    //   throw new BadRequestException({
    //     code: 'ALREADY_SPUN',
    //     message: 'Bu hafta zaten çark çevirdiniz',
    //     nextSpinAvailable: this.getNextMondayDate(),
    //   });
    // }

    // if (wheelSpin.spinRights <= 0) {
    //   throw new BadRequestException({
    //     code: 'NO_SPIN_RIGHTS',
    //     message: 'Çevirme hakkınız bulunmuyor',
    //   });
    // }

    // Spin the wheel - determine reward
    const reward = this.determineReward();
    const spunAt = new Date();

    // Apply reward and update spin record in transaction
    await this.prisma.$transaction(async (tx) => {
      // Update wheel spin record
      await tx.wheelSpin.update({
        where: { id: wheelSpin.id },
        data: {
          used: true,
          rewardType: reward.type,
          rewardValue: reward.value,
          spunAt,
        },
      });

      // Apply reward based on type
      await this.applyReward(tx, userId, reward);
    });

    // Emit wheel result to user
    this.eventsGateway.emitWheelResult(userId, {
      rewardType: reward.type,
      rewardValue: reward.value,
      message: reward.message,
      messageTr: reward.messageTr,
      nextSpinAvailable: this.getNextMondayDate(),
    });

    // Emit additional events based on reward type
    if (reward.type === WheelRewardType.points) {
      // If user won points, emit stats update
      this.eventsGateway.emitStatsUpdated(userId, {
        type: 'points',
        change: parseInt(reward.value),
      });
    } else if (reward.type === WheelRewardType.free_coffee || reward.type === WheelRewardType.discount) {
      // If user won campaign reward, emit campaign assigned
      this.eventsGateway.emitCampaignAssigned(userId, {
        campaignId: 'wheel-reward',
        campaignTitle: reward.message,
        campaignTitleTr: reward.messageTr,
      });
    } else if (reward.type === WheelRewardType.badge) {
      // If user won badge, emit badge earned
      this.eventsGateway.emitBadgeEarned(userId, {
        badgeId: reward.value,
        badgeName: 'Lucky Spinner',
        badgeNameTr: 'Şanslı Çevirici',
      });
    }

    return {
      rewardType: reward.type,
      rewardValue: reward.value,
      message: reward.messageTr,
      spunAt,
    };
  }

  // ==================== GET SPIN HISTORY ====================

  async getHistory(userId: string, limit: number = 10) {
    const spins = await this.prisma.wheelSpin.findMany({
      where: {
        userId,
        used: true,
      },
      orderBy: {
        spunAt: 'desc',
      },
      take: limit,
      select: {
        id: true,
        weekNumber: true,
        year: true,
        rewardType: true,
        rewardValue: true,
        spunAt: true,
      },
    });

    return spins;
  }

  // ==================== HELPER METHODS ====================

  /**
   * Get current ISO week number and year
   */
  private getCurrentWeekInfo(): { weekNumber: number; year: number } {
    const now = new Date();
    const year = now.getFullYear();

    // Calculate ISO week number
    const firstDayOfYear = new Date(year, 0, 1);
    const pastDaysOfYear = (now.getTime() - firstDayOfYear.getTime()) / 86400000;
    const weekNumber = Math.ceil(
      (pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7,
    );

    return { weekNumber, year };
  }

  /**
   * Get next Monday at 00:00
   */
  private getNextMondayDate(): Date {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;

    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + daysUntilMonday);
    nextMonday.setHours(0, 0, 0, 0);

    return nextMonday;
  }

  /**
   * Determine reward based on probabilities
   */
  private determineReward(): WheelSegment {
    const random = Math.random() * 100;
    let cumulativeProbability = 0;

    for (const segment of this.wheelSegments) {
      cumulativeProbability += segment.probability;
      if (random <= cumulativeProbability) {
        return segment;
      }
    }

    // Fallback to "nothing" (should never reach here if probabilities sum to 100)
    return this.wheelSegments[0];
  }

  /**
   * Apply the reward to user's account
   */
  private async applyReward(
    tx: any,
    userId: string,
    reward: WheelSegment,
  ): Promise<void> {
    // Calculate expiry date - 7 days from now for mystery box rewards
    // Calculate expiry date - 1 week (7 days) starting from today
    // Example: Today 29th (Day 1) -> Expires 4th (Day 7)
    // We set time to 20:59:59 UTC which matches 23:59:59 TRT (UTC+3)
    // This prevents the date from rolling over to the next day in the app display
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 6);
    expiresAt.setHours(20, 59, 59, 999);

    switch (reward.type) {
      case WheelRewardType.points:
        // Add points to loyalty
        await tx.loyaltyPoints.update({
          where: { userId },
          data: {
            totalPoints: {
              increment: parseInt(reward.value),
            },
          },
        });
        break;

      case WheelRewardType.free_coffee:
        // Create a free coffee campaign for user
        const freeCoffeeCampaign = await tx.campaign.findFirst({
          where: {
            type: 'auto',
            rewardType: 'free_coffee',
            isActive: true,
          },
        });

        if (freeCoffeeCampaign) {
          await tx.userCampaign.create({
            data: {
              userId,
              campaignId: freeCoffeeCampaign.id,
              status: 'active',
              expiresAt,
            },
          });
        }
        break;

      case WheelRewardType.discount:
        // Create a discount campaign for user
        // First check if we have a discount campaign template
        let discountCampaign = await tx.campaign.findFirst({
          where: {
            type: 'auto',
            rewardType: 'discount_percent',
            rewardValue: parseFloat(reward.value),
            isActive: true,
          },
        });

        // If no template exists, create one
        if (!discountCampaign) {
          discountCampaign = await tx.campaign.create({
            data: {
              type: 'auto',
              title: `${reward.value}% Discount`,
              titleTr: `%${reward.value} İndirim`,
              description: `Wheel spin reward - ${reward.value}% discount`,
              descriptionTr: `Çark ödülü - %${reward.value} indirim`,
              rewardType: 'discount_percent',
              rewardValue: parseFloat(reward.value),
              requiredPoints: 0,
              isActive: true,
            },
          });
        }

        await tx.userCampaign.create({
          data: {
            userId,
            campaignId: discountCampaign.id,
            status: 'active',
            expiresAt,
          },
        });
        break;

      case WheelRewardType.badge:
        // Award badge if exists
        const badge = await tx.badge.findFirst({
          where: {
            name: reward.value,
            isActive: true,
          },
        });

        if (badge) {
          // Check if user already has this badge
          const existingBadge = await tx.userBadge.findUnique({
            where: {
              userId_badgeId: {
                userId,
                badgeId: badge.id,
              },
            },
          });

          if (!existingBadge) {
            await tx.userBadge.create({
              data: {
                userId,
                badgeId: badge.id,
              },
            });
          }
        }
        break;

      case WheelRewardType.nothing:
        // No reward to apply
        break;

      case WheelRewardType.retry:
        // User gets another spin - add spin right back
        // Note: This is handled in the spin method by not consuming the spin
        // For now, we just don't apply any reward
        break;

      case WheelRewardType.free_cookie:
        // Create a free cookie campaign for user
        let freeCookieCampaign = await tx.campaign.findFirst({
          where: {
            type: 'auto',
            title: 'Free Cookie',
            isActive: true,
          },
        });

        if (!freeCookieCampaign) {
          freeCookieCampaign = await tx.campaign.create({
            data: {
              type: 'auto',
              title: 'Free Cookie',
              titleTr: 'Ücretsiz Kurabiye',
              description: 'Mystery Box reward - Free Cookie',
              descriptionTr: 'Mystery Box ödülü - Ücretsiz Kurabiye',
              rewardType: 'free_coffee',
              rewardValue: 0,
              requiredPoints: 0,
              isActive: true,
            },
          });
        }

        await tx.userCampaign.create({
          data: {
            userId,
            campaignId: freeCookieCampaign.id,
            status: 'active',
            expiresAt,
          },
        });
        break;

      case WheelRewardType.second_drink_discount:
        // Create 50% off 2nd drink campaign
        let secondDrinkCampaign = await tx.campaign.findFirst({
          where: {
            type: 'auto',
            title: '50% Off 2nd Drink',
            isActive: true,
          },
        });

        if (!secondDrinkCampaign) {
          secondDrinkCampaign = await tx.campaign.create({
            data: {
              type: 'auto',
              title: '50% Off 2nd Drink',
              titleTr: '2. İçeceğe %50 İndirim',
              description: 'Mystery Box reward - 50% off your second drink',
              descriptionTr: 'Mystery Box ödülü - İkinci içeceğinize %50 indirim',
              rewardType: 'discount_percent',
              rewardValue: 50,
              requiredPoints: 0,
              isActive: true,
            },
          });
        }

        await tx.userCampaign.create({
          data: {
            userId,
            campaignId: secondDrinkCampaign.id,
            status: 'active',
            expiresAt,
          },
        });
        break;

      case WheelRewardType.coffee_and_cookie:
        // Create coffee + cookie combo campaign
        let comboCampaign = await tx.campaign.findFirst({
          where: {
            type: 'auto',
            title: 'Coffee & Cookie',
            isActive: true,
          },
        });

        if (!comboCampaign) {
          comboCampaign = await tx.campaign.create({
            data: {
              type: 'auto',
              title: 'Coffee & Cookie',
              titleTr: 'Kahve ve Kurabiye',
              description: 'Mystery Box reward - Free Coffee & Cookie combo',
              descriptionTr: 'Mystery Box ödülü - Ücretsiz Kahve ve Kurabiye',
              rewardType: 'free_coffee',
              rewardValue: 0,
              requiredPoints: 0,
              isActive: true,
            },
          });
        }

        await tx.userCampaign.create({
          data: {
            userId,
            campaignId: comboCampaign.id,
            status: 'active',
            expiresAt,
          },
        });
        break;
    }
  }
}
