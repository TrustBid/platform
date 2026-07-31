import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OrganizationsService } from './organizations.service';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import {
  CreateInviteDto,
  UpdateNotificationPreferencesDto,
  UpdateOrgUserDto,
} from './dto/settings.dto';
import { CurrentOrg, CurrentUser } from '../../common/decorators/org.decorator';
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

  @Patch('users/:id')
  @Roles('admin')
  updateUser(
    @CurrentOrg() orgId: string,
    @CurrentUser() actor: { sub: string },
    @Param('id') id: string,
    @Body() dto: UpdateOrgUserDto,
  ) {
    return this.svc.updateUser(orgId, actor?.sub, id, dto);
  }

  // ── Invitaciones ─────────────────────────────────────────────────────────────

  @Get('invites')
  @Roles('admin')
  listInvites(@CurrentOrg() orgId: string) {
    return this.svc.listInvites(orgId);
  }

  @Post('invites')
  @Roles('admin')
  createInvite(
    @CurrentOrg() orgId: string,
    @CurrentUser() user: { sub: string },
    @Body() dto: CreateInviteDto,
  ) {
    return this.svc.createInvite(orgId, user?.sub ?? null, dto);
  }

  @Delete('invites/:id')
  @Roles('admin')
  revokeInvite(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.svc.revokeInvite(orgId, id);
  }

  // ── Notificaciones ───────────────────────────────────────────────────────────

  @Get('settings/notifications')
  getNotifications(@CurrentOrg() orgId: string) {
    return this.svc.getNotificationPreferences(orgId);
  }

  @Put('settings/notifications')
  @Roles('admin')
  setNotifications(
    @CurrentOrg() orgId: string,
    @Body() dto: UpdateNotificationPreferencesDto,
  ) {
    return this.svc.setNotificationPreferences(orgId, dto.preferences);
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

  // ── Imágenes de perfil ───────────────────────────────────────────────────────

  @Post('logo')
  @Roles('admin')
  @UseInterceptors(FileInterceptor('file'))
  setLogo(@CurrentOrg() orgId: string, @UploadedFile() file: Express.Multer.File) {
    return this.svc.setLogo(orgId, file);
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('file'))
  setAvatar(
    @CurrentUser() user: { sub: string },
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.svc.setAvatar(user.sub, file);
  }

  // ── Lookups (public) ─────────────────────────────────────────────────────────

  @Public()
  @Get('lookups')
  getLookups() {
    return this.svc.getLookups();
  }
}
