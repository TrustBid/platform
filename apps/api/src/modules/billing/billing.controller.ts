import { Body, Controller, Get, Post } from '@nestjs/common';
import { IsString, MaxLength } from 'class-validator';
import { BillingService } from './billing.service';
import { CurrentOrg } from '../../common/decorators/org.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

class ChangePlanDto {
  @IsString()
  @MaxLength(32)
  planCode: string;
}

@Controller('my/billing')
export class BillingController {
  constructor(private readonly svc: BillingService) {}

  @Get()
  getSummary(@CurrentOrg() orgId: string) {
    return this.svc.getSummary(orgId);
  }

  @Get('plans')
  listPlans() {
    return this.svc.listPlans();
  }

  @Post('change-plan')
  @Roles('admin')
  changePlan(@CurrentOrg() orgId: string, @Body() dto: ChangePlanDto) {
    return this.svc.changePlan(orgId, dto.planCode);
  }

  @Post('cancel')
  @Roles('admin')
  cancel(@CurrentOrg() orgId: string) {
    return this.svc.cancel(orgId);
  }
}
