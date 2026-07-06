import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { CurrentOrg, CurrentUser } from '../../common/decorators/org.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { EnrollmentService } from './enrollment.service';
import { CreateInviteDto } from './dto/create-invite.dto';

/** Gestión de invitaciones de voluntarios (auto-enrolamiento por link). Solo admin. */
@Controller('my/bot/invites')
@Roles('admin', 'admin_regional')
export class WhatsappAdminController {
  constructor(private readonly enrollment: EnrollmentService) {}

  @Post()
  create(
    @Body() body: CreateInviteDto,
    @CurrentOrg() orgId: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.enrollment.createInvite(orgId, user.sub, body);
  }

  @Get()
  list(@CurrentOrg() orgId: string) {
    return this.enrollment.listInvites(orgId);
  }

  @Delete(':id')
  revoke(@Param('id', ParseUUIDPipe) id: string, @CurrentOrg() orgId: string) {
    return this.enrollment.revokeInvite(orgId, id);
  }
}
