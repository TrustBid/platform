import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { AreasService } from './areas.service';
import { CreateAreaDto, UpdateAreaDto } from './dto/area.dto';
import { CurrentOrg } from '../../common/decorators/org.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('my/areas')
export class AreasController {
  constructor(private readonly svc: AreasService) {}

  @Get()
  list(@CurrentOrg() orgId: string) {
    return this.svc.list(orgId);
  }

  @Post()
  @Roles('admin')
  create(@CurrentOrg() orgId: string, @Body() dto: CreateAreaDto) {
    return this.svc.create(orgId, dto);
  }

  @Patch(':id')
  @Roles('admin')
  update(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAreaDto,
  ) {
    return this.svc.update(orgId, id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.svc.remove(orgId, id);
  }
}
