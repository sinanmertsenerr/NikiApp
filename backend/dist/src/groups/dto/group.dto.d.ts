export declare class CreateGroupDto {
    name: string;
    description?: string;
}
export declare class UpdateGroupDto {
    name?: string;
    description?: string;
}
export declare class AddMemberDto {
    userId: string;
}
export declare class AddMembersDto {
    userIds: string[];
}
