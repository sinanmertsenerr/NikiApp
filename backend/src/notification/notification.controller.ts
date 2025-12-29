import {
    Controller,
    Get,
    Post,
    Patch,
    Param,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards';
import { CurrentUser } from '../common/decorators';
import { NotificationService } from './notification.service';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class NotificationController {
    constructor(private readonly notificationService: NotificationService) { }

    @Get()
    @ApiOperation({ summary: 'Get user notifications' })
    @ApiResponse({ status: 200, description: 'Notifications returned' })
    async getNotifications(@CurrentUser('id') userId: string) {
        const notifications = await this.notificationService.getUserNotifications(userId);
        return {
            success: true,
            data: { notifications },
        };
    }

    @Get('unread-count')
    @ApiOperation({ summary: 'Get unread notification count' })
    @ApiResponse({ status: 200, description: 'Unread count returned' })
    async getUnreadCount(@CurrentUser('id') userId: string) {
        const count = await this.notificationService.getUnreadCount(userId);
        return {
            success: true,
            data: { count },
        };
    }

    @Patch(':id/read')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Mark notification as read' })
    @ApiResponse({ status: 200, description: 'Notification marked as read' })
    async markAsRead(
        @CurrentUser('id') userId: string,
        @Param('id') notificationId: string,
    ) {
        await this.notificationService.markAsRead(userId, notificationId);
        return {
            success: true,
            message: 'Bildirim okundu olarak işaretlendi',
        };
    }

    @Post('mark-all-read')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Mark all notifications as read' })
    @ApiResponse({ status: 200, description: 'All notifications marked as read' })
    async markAllAsRead(@CurrentUser('id') userId: string) {
        const count = await this.notificationService.markAllAsRead(userId);
        return {
            success: true,
            message: `${count} bildirim okundu olarak işaretlendi`,
            data: { markedCount: count },
        };
    }
}
