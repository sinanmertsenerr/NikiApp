import { GroupsService } from './groups.service';
import { CreateGroupDto, UpdateGroupDto, AddMemberDto, AddMembersDto } from './dto/group.dto';
export declare class GroupsController {
    private readonly groupsService;
    constructor(groupsService: GroupsService);
    getMyGroups(userId: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        memberCount: number;
        addedAt: Date;
    }[]>;
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
    addMember(groupId: string, dto: AddMemberDto): Promise<{
        success: boolean;
        message: string;
    }>;
    addMembers(groupId: string, dto: AddMembersDto): Promise<{
        success: boolean;
        message: string;
        addedCount: number;
    }>;
    removeMember(groupId: string, userId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
