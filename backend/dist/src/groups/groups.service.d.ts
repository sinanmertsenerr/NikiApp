import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto, UpdateGroupDto } from './dto/group.dto';
export declare class GroupsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        id: string;
        name: string;
        description: string | null;
        memberCount: number;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        members: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
            avatarUrl: string | null;
            isActive: boolean;
            addedAt: Date;
        }[];
    }>;
    create(dto: CreateGroupDto): Promise<{
        id: string;
        name: string;
        description: string | null;
        memberCount: number;
        createdAt: Date;
    }>;
    update(id: string, dto: UpdateGroupDto): Promise<{
        id: string;
        name: string;
        description: string | null;
    }>;
    delete(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    addMember(groupId: string, userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    addMembers(groupId: string, userIds: string[]): Promise<{
        success: boolean;
        message: string;
        addedCount: number;
    }>;
    removeMember(groupId: string, userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getMyGroups(userId: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        memberCount: number;
        addedAt: Date;
    }[]>;
}
