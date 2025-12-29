import { Module } from '@nestjs/common';
import { RafflesService } from './raffles.service';
import { RafflesController } from './raffles.controller';
import { AdminRafflesController } from './admin-raffles.controller';
import { PrismaModule } from '../prisma';
import { NotificationModule } from '../notification';

@Module({
    imports: [PrismaModule, NotificationModule],
    controllers: [RafflesController, AdminRafflesController],
    providers: [RafflesService],
    exports: [RafflesService],
})
export class RafflesModule { }
