import { Body, Controller, Get, Patch } from '@nestjs/common';
import { OrgService } from './org.service';
import { UpdateOrgDto } from './dto/update-org.dto';
import { CurrentOrg } from '../../common/decorators/org.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

// RolesGuard es global (APP_GUARD); @Roles en el handler basta.
@Controller('my/org')
export class OrgController {
  constructor(private readonly orgService: OrgService) {}

  @Get()
  getOrg(@CurrentOrg() orgId: string) {
    return this.orgService.getOrg(orgId);
  }

  @Patch()
  @Roles('admin')
  updateOrg(@CurrentOrg() orgId: string, @Body() body: UpdateOrgDto) {
    return this.orgService.updateOrg(orgId, body);
  }

  @Get('users')
  listUsers(@CurrentOrg() orgId: string) {
    return this.orgService.listUsers(orgId);
  }

  @Get('settings/integrations')
  getSettingsIntegrations(@CurrentOrg() orgId: string) {
    return this.orgService.getSettingsIntegrations(orgId);
  }
}
