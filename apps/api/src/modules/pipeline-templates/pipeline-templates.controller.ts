import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { PipelineTemplatesService } from './pipeline-templates.service';
import { CreateTemplateDto, UpdateTemplateDto } from './dto/template.dto';
import { CurrentOrg, CurrentUser } from '../../common/decorators/org.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('my/pipeline-templates')
export class PipelineTemplatesController {
  constructor(private readonly svc: PipelineTemplatesService) {}

  @Get()
  list(@CurrentOrg() orgId: string) {
    return this.svc.list(orgId);
  }

  @Post()
  @Roles('admin')
  create(
    @CurrentOrg() orgId: string,
    @CurrentUser() user: { sub: string },
    @Body() dto: CreateTemplateDto,
  ) {
    return this.svc.create(orgId, user?.sub ?? null, dto);
  }

  @Patch(':id')
  @Roles('admin')
  update(
    @CurrentOrg() orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTemplateDto,
  ) {
    return this.svc.update(orgId, id, dto);
  }

  @Post(':id/duplicate')
  @Roles('admin')
  duplicate(
    @CurrentOrg() orgId: string,
    @CurrentUser() user: { sub: string },
    @Param('id') id: string,
  ) {
    return this.svc.duplicate(orgId, id, user?.sub ?? null);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@CurrentOrg() orgId: string, @Param('id') id: string) {
    return this.svc.remove(orgId, id);
  }
}
