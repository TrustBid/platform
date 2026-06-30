import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from '../../database/database.module';
import { HorizonWatcherService, HORIZON_WATCH_QUEUE } from './horizon-watcher.service';
import { HorizonWatcherProcessor } from './horizon-watcher.processor';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: { url: config.getOrThrow<string>('REDIS_URL') },
      }),
    }),
    BullModule.registerQueue({ name: HORIZON_WATCH_QUEUE }),
    DatabaseModule,
  ],
  providers: [HorizonWatcherService, HorizonWatcherProcessor],
  exports: [HorizonWatcherService],
})
export class HorizonWatcherModule {}
