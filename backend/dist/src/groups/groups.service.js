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
exports.GroupsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let GroupsService = class GroupsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        const groups = await this.prisma.group.findMany({
            where: { isActive: true },
            include: {
                _count: {
                    select: { members: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return groups.map((group) => ({
            id: group.id,
            name: group.name,
            description: group.description,
            memberCount: group._count.members,
            createdAt: group.createdAt,
            updatedAt: group.updatedAt,
        }));
    }
    async findOne(id) {
        const group = await this.prisma.group.findUnique({
            where: { id },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                avatarUrl: true,
                                isActive: true,
                            },
                        },
                    },
                    orderBy: { addedAt: 'desc' },
                },
            },
        });
        if (!group) {
            throw new common_1.NotFoundException('Group not found');
        }
        return {
            id: group.id,
            name: group.name,
            description: group.description,
            isActive: group.isActive,
            createdAt: group.createdAt,
            updatedAt: group.updatedAt,
            members: group.members.map((m) => ({
                id: m.user.id,
                firstName: m.user.firstName,
                lastName: m.user.lastName,
                email: m.user.email,
                avatarUrl: m.user.avatarUrl,
                isActive: m.user.isActive,
                addedAt: m.addedAt,
            })),
        };
    }
    async create(dto) {
        const group = await this.prisma.group.create({
            data: {
                name: dto.name,
                description: dto.description,
            },
        });
        return {
            id: group.id,
            name: group.name,
            description: group.description,
            memberCount: 0,
            createdAt: group.createdAt,
        };
    }
    async update(id, dto) {
        const group = await this.prisma.group.findUnique({ where: { id } });
        if (!group) {
            throw new common_1.NotFoundException('Group not found');
        }
        const updated = await this.prisma.group.update({
            where: { id },
            data: {
                name: dto.name,
                description: dto.description,
            },
        });
        return {
            id: updated.id,
            name: updated.name,
            description: updated.description,
        };
    }
    async delete(id) {
        const group = await this.prisma.group.findUnique({ where: { id } });
        if (!group) {
            throw new common_1.NotFoundException('Group not found');
        }
        await this.prisma.group.delete({ where: { id } });
        return { success: true, message: 'Group deleted' };
    }
    async addMember(groupId, userId) {
        const group = await this.prisma.group.findUnique({ where: { id: groupId } });
        if (!group) {
            throw new common_1.NotFoundException('Group not found');
        }
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const existing = await this.prisma.groupMember.findUnique({
            where: { groupId_userId: { groupId, userId } },
        });
        if (existing) {
            throw new common_1.ConflictException('User is already a member of this group');
        }
        await this.prisma.groupMember.create({
            data: { groupId, userId },
        });
        return { success: true, message: 'Member added' };
    }
    async addMembers(groupId, userIds) {
        const group = await this.prisma.group.findUnique({ where: { id: groupId } });
        if (!group) {
            throw new common_1.NotFoundException('Group not found');
        }
        const existingMembers = await this.prisma.groupMember.findMany({
            where: { groupId, userId: { in: userIds } },
            select: { userId: true },
        });
        const existingIds = new Set(existingMembers.map((m) => m.userId));
        const newUserIds = userIds.filter((id) => !existingIds.has(id));
        if (newUserIds.length === 0) {
            return { success: true, message: 'No new members to add', addedCount: 0 };
        }
        await this.prisma.groupMember.createMany({
            data: newUserIds.map((userId) => ({ groupId, userId })),
        });
        return {
            success: true,
            message: `${newUserIds.length} members added`,
            addedCount: newUserIds.length,
        };
    }
    async removeMember(groupId, userId) {
        const member = await this.prisma.groupMember.findUnique({
            where: { groupId_userId: { groupId, userId } },
        });
        if (!member) {
            throw new common_1.NotFoundException('Member not found in this group');
        }
        await this.prisma.groupMember.delete({
            where: { groupId_userId: { groupId, userId } },
        });
        return { success: true, message: 'Member removed' };
    }
    async getMyGroups(userId) {
        const memberships = await this.prisma.groupMember.findMany({
            where: { userId },
            include: {
                group: {
                    include: {
                        _count: { select: { members: true } },
                    },
                },
            },
            orderBy: { addedAt: 'desc' },
        });
        return memberships.map((m) => ({
            id: m.group.id,
            name: m.group.name,
            description: m.group.description,
            memberCount: m.group._count.members,
            addedAt: m.addedAt,
        }));
    }
};
exports.GroupsService = GroupsService;
exports.GroupsService = GroupsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GroupsService);
//# sourceMappingURL=groups.service.js.map