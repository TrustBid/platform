import { Body, Controller, Get, Patch } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { CurrentOrg } from '../../common/decorators/org.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';

@Controller('my/org')
export class OrganizationsController {
  constructor(private readonly svc: OrganizationsService) {}

  // ── Simple org ───────────────────────────────────────────────────────────────

  @Get()
  getOrg(@CurrentOrg() orgId: string) {
    return this.svc.getOrg(orgId);
  }

  @Patch()
  @Roles('admin')
  updateOrg(
    @CurrentOrg() orgId: string,
    @Body() body: { name?: string; country?: string },
  ) {
    return this.svc.updateOrg(orgId, body);
  }

  // ── Users ────────────────────────────────────────────────────────────────────

  @Get('users')
  listUsers(@CurrentOrg() orgId: string) {
    return this.svc.listUsers(orgId);
  }

  // ── Stellar integrations ─────────────────────────────────────────────────────

  @Get('settings/integrations')
  getSettingsIntegrations(@CurrentOrg() orgId: string) {
    return this.svc.getSettingsIntegrations(orgId);
  }

  // ── Full profile with relations ───────────────────────────────────────────────

  @Get('profile')
  getProfile(@CurrentOrg() orgId: string) {
    return this.svc.getOrganization(orgId);
  }

  @Patch('profile')
  @Roles('admin')
  updateProfile(@CurrentOrg() orgId: string, @Body() dto: UpdateOrganizationDto) {
    return this.svc.updateOrganization(orgId, dto);
  }

  // ── Lookups (public) ─────────────────────────────────────────────────────────

  @Public()
  @Get('lookups')
  getLookups() {
    return this.svc.getLookups();
  }
}
