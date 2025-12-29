"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WheelService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_1 = require("../prisma");
const events_1 = require("../events");
let WheelService = class WheelService {
    prisma;
    eventsGateway;
    wheelSegments = [
        {
            type: client_1.WheelRewardType.nothing,
            value: '0',
            probability: 40,
            message: 'Better luck next time!',
            messageTr: 'Bir dahaki sefere!',
        },
        {
            type: client_1.WheelRewardType.discount,
            value: '10',
            probability: 10,
            message: 'You won 10% discount!',
            messageTr: '%10 indirim kazandınız!',
        },
        {
            type: client_1.WheelRewardType.retry,
            value: '1',
            probability: 10,
            message: 'Try again!',
            messageTr: 'Tekrar dene!',
        },
        {
            type: client_1.WheelRewardType.second_drink_discount,
            value: '50',
            probability: 10,
            message: '50% off your 2nd drink!',
            messageTr: '2. içeceğe %50 indirim!',
        },
        {
            type: client_1.WheelRewardType.discount,
            value: '20',
            probability: 7,
            message: 'You won 20% discount!',
            messageTr: '%20 indirim kazandınız!',
        },
        {
            type: client_1.WheelRewardType.free_cookie,
            value: '1',
            probability: 5,
            message: 'You won a FREE COOKIE!',
            messageTr: 'Ücretsiz kurabiye kazandınız!',
        },
        {
            type: client_1.WheelRewardType.discount,
            value: '30',
            probability: 5,
            message: 'You won 30% discount!',
            messageTr: '%30 indirim kazandınız!',
        },
        {
            type: client_1.WheelRewardType.free_coffee,
            value: '1',
            probability: 5,
            message: 'You won a FREE COFFEE!',
            messageTr: 'Ücretsiz kahve kazandınız!',
        },
        {
            type: client_1.WheelRewardType.coffee_and_cookie,
            value: '1',
            probability: 5,
            message: 'You won Coffee & Cookie!',
            messageTr: 'Kahve ve kurabiye kazandınız!',
        },
        {
            type: client_1.WheelRewardType.points,
            value: '1',
            probability: 3,
            message: 'You won 1 point!',
            messageTr: '1 puan kazandınız!',
        },
    ];
    constructor(prisma, eventsGateway) {
        this.prisma = prisma;
        this.eventsGateway = eventsGateway;
    }
    async getStatus(userId) {
        const { weekNumber, year } = this.getCurrentWeekInfo();
        let wheelSpin = await this.prisma.wheelSpin.findUnique({
            where: {
                userId_weekNumber_year: {
                    userId,
                    weekNumber,
                    year,
                },
            },
        });
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
        const canSpin = true;
        const response = {
            canSpin,
            spinRights: 1,
            weekNumber,
            year,
        };
        if (wheelSpin.used && wheelSpin.rewardType && wheelSpin.spunAt) {
            response.lastSpin = {
                rewardType: wheelSpin.rewardType,
                rewardValue: wheelSpin.rewardValue || '0',
                spunAt: wheelSpin.spunAt,
            };
            response.nextSpinAvailable = this.getNextMondayDate();
        }
        return response;
    }
    async spin(userId) {
        const { weekNumber, year } = this.getCurrentWeekInfo();
        let wheelSpin = await this.prisma.wheelSpin.findUnique({
            where: {
                userId_weekNumber_year: {
                    userId,
                    weekNumber,
                    year,
                },
            },
        });
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
        const reward = this.determineReward();
        const spunAt = new Date();
        await this.prisma.$transaction(async (tx) => {
            await tx.wheelSpin.update({
                where: { id: wheelSpin.id },
                data: {
                    used: true,
                    rewardType: reward.type,
                    rewardValue: reward.value,
                    spunAt,
                },
            });
            await this.applyReward(tx, userId, reward);
        });
        this.eventsGateway.emitWheelResult(userId, {
            rewardType: reward.type,
            rewardValue: reward.value,
            message: reward.message,
            messageTr: reward.messageTr,
            nextSpinAvailable: this.getNextMondayDate(),
        });
        if (reward.type === client_1.WheelRewardType.points) {
            this.eventsGateway.emitStatsUpdated(userId, {
                type: 'points',
                change: parseInt(reward.value),
            });
        }
        else if (reward.type === client_1.WheelRewardType.free_coffee || reward.type === client_1.WheelRewardType.discount) {
            this.eventsGateway.emitCampaignAssigned(userId, {
                campaignId: 'wheel-reward',
                campaignTitle: reward.message,
                campaignTitleTr: reward.messageTr,
            });
        }
        else if (reward.type === client_1.WheelRewardType.badge) {
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
    async getHistory(userId, limit = 10) {
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
    getCurrentWeekInfo() {
        const now = new Date();
        const year = now.getFullYear();
        const firstDayOfYear = new Date(year, 0, 1);
        const pastDaysOfYear = (now.getTime() - firstDayOfYear.getTime()) / 86400000;
        const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
        return { weekNumber, year };
    }
    getNextMondayDate() {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
        const nextMonday = new Date(now);
        nextMonday.setDate(now.getDate() + daysUntilMonday);
        nextMonday.setHours(0, 0, 0, 0);
        return nextMonday;
    }
    determineReward() {
        const random = Math.random() * 100;
        let cumulativeProbability = 0;
        for (const segment of this.wheelSegments) {
            cumulativeProbability += segment.probability;
            if (random <= cumulativeProbability) {
                return segment;
            }
        }
        return this.wheelSegments[0];
    }
    async applyReward(tx, userId, reward) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 6);
        expiresAt.setHours(20, 59, 59, 999);
        switch (reward.type) {
            case client_1.WheelRewardType.points:
                await tx.loyaltyPoints.update({
                    where: { userId },
                    data: {
                        totalPoints: {
                            increment: parseInt(reward.value),
                        },
                    },
                });
                break;
            case client_1.WheelRewardType.free_coffee:
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
            case client_1.WheelRewardType.discount:
                let discountCampaign = await tx.campaign.findFirst({
                    where: {
                        type: 'auto',
                        rewardType: 'discount_percent',
                        rewardValue: parseFloat(reward.value),
                        isActive: true,
                    },
                });
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
            case client_1.WheelRewardType.badge:
                const badge = await tx.badge.findFirst({
                    where: {
                        name: reward.value,
                        isActive: true,
                    },
                });
                if (badge) {
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
            case client_1.WheelRewardType.nothing:
                break;
            case client_1.WheelRewardType.retry:
                break;
            case client_1.WheelRewardType.free_cookie:
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
            case client_1.WheelRewardType.second_drink_discount:
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
            case client_1.WheelRewardType.coffee_and_cookie:
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
};
exports.WheelService = WheelService;
exports.WheelService = WheelService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_1.PrismaService,
        events_1.EventsGateway])
], WheelService);
//# sourceMappingURL=wheel.service.js.map