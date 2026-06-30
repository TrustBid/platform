import { Body, Controller, Get, Patch } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { CurrentOrg } from '../../common/decorators/org.decorator';
import { Public } from '../../common/decorators/public.decorator';

@Controller('my/organization')
export class OrganizationsController {
  constructor(private readonly svc: OrganizationsService) {}

  @Get()
  get(@CurrentOrg() orgId: string) {
    return this.svc.getOrganization(orgId);
  }

  @Patch()
  update(@CurrentOrg() orgId: string, @Body() dto: UpdateOrganizationDto) {
    return this.svc.updateOrganization(orgId, dto);
  }

  @Public()
  @Get('lookups')
  lookups() {
    return this.svc.getLookups();
  }
}
