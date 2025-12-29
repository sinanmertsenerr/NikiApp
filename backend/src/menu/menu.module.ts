import { Module } from '@nestjs/common';
import { MenuController } from './menu.controller';
import { AdminMenuController } from './admin-menu.controller';
import { MenuService } from './menu.service';
import { EventsModule } from '../events';

@Module({
  imports: [EventsModule],
  controllers: [MenuController, AdminMenuController],
  providers: [MenuService],
  exports: [MenuService],
})
export class MenuModule {}
