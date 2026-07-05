import { Body, Controller, Get, Param, ParseIntPipe, ParseUUIDPipe, Post } from '@nestjs/common';
import { BadgesService } from './badges.service';
import { MintBadgeDto, RevokeBadgeDto } from './dto/mint-badge.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/org.decorator';
import { Public } from '../../common/decorators/public.decorator';

@Controller()
export class BadgesController {
  constructor(private readonly badgesService: BadgesService) {}

  @Roles('admin')
  @Post('admin/badges/mint')
  mint(@Body() body: MintBadgeDto, @CurrentUser() user: { sub: string }) {
    return this.badgesService.mint(body, user.sub);
  }

  @Roles('admin')
  @Post('admin/badges/:tokenId/revoke')
  revoke(
    @Param('tokenId', ParseIntPipe) tokenId: number,
    @Body() body: RevokeBadgeDto,
  ) {
    return this.badgesService.revoke(tokenId, body.organizationId);
  }

  @Public()
  @Get('organizations/:id/badges')
  listPublic(@Param('id', ParseUUIDPipe) id: string) {
    return this.badgesService.listByOrganization(id);
  }
}
