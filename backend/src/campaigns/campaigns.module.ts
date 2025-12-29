import { Module } from '@nestjs/common';
import { CampaignsController } from './campaigns.controller';
import { AdminCampaignsController } from './admin-campaigns.controller';
import { CampaignsService } from './campaigns.service';
import { NotificationModule } from '../notification';

@Module({
  imports: [NotificationModule],
  controllers: [CampaignsController, AdminCampaignsController],
  providers: [CampaignsService],
  exports: [CampaignsService],
})
export class CampaignsModule { }

