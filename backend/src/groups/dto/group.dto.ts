import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsArray } from 'class-validator';

export class CreateGroupDto {
    @ApiProperty({ example: 'VIP Müşteriler', description: 'Group name' })
    @IsString()
    name: string;

    @ApiPropertyOptional({ example: 'Premium müşteri grubu', description: 'Group description' })
    @IsOptional()
    @IsString()
    description?: string;
}

export class UpdateGroupDto {
    @ApiPropertyOptional({ example: 'VIP Müşteriler', description: 'Group name' })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({ example: 'Premium müşteri grubu', description: 'Group description' })
    @IsOptional()
    @IsString()
    description?: string;
}

export class AddMemberDto {
    @ApiProperty({ example: 'user-uuid-here', description: 'User ID to add' })
    @IsUUID()
    userId: string;
}

export class AddMembersDto {
    @ApiProperty({ example: ['user-uuid-1', 'user-uuid-2'], description: 'User IDs to add' })
    @IsArray()
    @IsUUID('all', { each: true })
    userIds: string[];
}
