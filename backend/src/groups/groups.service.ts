import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto, UpdateGroupDto } from './dto/group.dto';

@Injectable()
export class GroupsService {
    constructor(private prisma: PrismaService) { }

    /**
     * Get all groups with member count
     */
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

    /**
     * Get group by ID with members
     */
    async findOne(id: string) {
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
            throw new NotFoundException('Group not found');
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

    /**
     * Create new group
     */
    async create(dto: CreateGroupDto) {
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

    /**
     * Update group
     */
    async update(id: string, dto: UpdateGroupDto) {
        const group = await this.prisma.group.findUnique({ where: { id } });
        if (!group) {
            throw new NotFoundException('Group not found');
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

    /**
     * Delete group
     */
    async delete(id: string) {
        const group = await this.prisma.group.findUnique({ where: { id } });
        if (!group) {
            throw new NotFoundException('Group not found');
        }

        await this.prisma.group.delete({ where: { id } });

        return { success: true, message: 'Group deleted' };
    }

    /**
     * Add member to group
     */
    async addMember(groupId: string, userId: string) {
        const group = await this.prisma.group.findUnique({ where: { id: groupId } });
        if (!group) {
            throw new NotFoundException('Group not found');
        }

        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const existing = await this.prisma.groupMember.findUnique({
            where: { groupId_userId: { groupId, userId } },
        });
        if (existing) {
            throw new ConflictException('User is already a member of this group');
        }

        await this.prisma.groupMember.create({
            data: { groupId, userId },
        });

        return { success: true, message: 'Member added' };
    }

    /**
     * Add multiple members to group
     */
    async addMembers(groupId: string, userIds: string[]) {
        const group = await this.prisma.group.findUnique({ where: { id: groupId } });
        if (!group) {
            throw new NotFoundException('Group not found');
        }

        // Filter out existing members
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

    /**
     * Remove member from group
     */
    async removeMember(groupId: string, userId: string) {
        const member = await this.prisma.groupMember.findUnique({
            where: { groupId_userId: { groupId, userId } },
        });
        if (!member) {
            throw new NotFoundException('Member not found in this group');
        }

        await this.prisma.groupMember.delete({
            where: { groupId_userId: { groupId, userId } },
        });

        return { success: true, message: 'Member removed' };
    }

    /**
     * Get groups for a user
     */
    async getMyGroups(userId: string) {
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
}
