import { Body, Controller, Get, Post } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { CurrentOrg, CurrentUser } from '../../common/decorators/org.decorator';

@Controller('my/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  list(@CurrentOrg() orgId: string) {
    return this.reportsService.listByOrg(orgId);
  }

  @Post()
  create(
    @Body() body: CreateReportDto,
    @CurrentOrg() orgId: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.reportsService.create(orgId, user.sub, body);
  }
}
