import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';
import { HorizonWatcherModule } from '../horizon/horizon-watcher.module';

@Module({
  imports: [HorizonWatcherModule],
  controllers: [PublicController],
  providers: [PublicService],
})
export class PublicModule {}
