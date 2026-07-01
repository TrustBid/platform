import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { SorobanModule } from '../soroban/soroban.module';

@Module({
  imports: [SorobanModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
