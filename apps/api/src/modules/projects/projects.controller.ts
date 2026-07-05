import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { CurrentOrg, CurrentUser } from '../../common/decorators/org.decorator';

@Controller('my/projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  list(@CurrentOrg() orgId: string) {
    return this.projectsService.listByOrg(orgId);
  }

  // Debe declararse antes de `:id` para que no lo capture el ParseUUIDPipe.
  @Get('recent-activity')
  recentActivity(@CurrentOrg() orgId: string) {
    return this.projectsService.getRecentActivity(orgId);
  }

  @Get(':id')
  getOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentOrg() orgId: string,
  ) {
    return this.projectsService.getById(id, orgId);
  }

  @Get(':id/transactions')
  getTransactions(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentOrg() orgId: string,
  ) {
    return this.projectsService.getTransactions(id, orgId);
  }

  @Post(':id/transactions')
  @UseInterceptors(FileInterceptor('file'))
  createTransaction(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: CreateTransactionDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentOrg() orgId: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.projectsService.createTransaction(orgId, user.sub, id, body, file);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateProjectDto,
    @CurrentOrg() orgId: string,
  ) {
    return this.projectsService.update(id, orgId, body);
  }

  @Post()
  create(
    @Body() body: CreateProjectDto,
    @CurrentOrg() orgId: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.projectsService.create(orgId, user.sub, body);
  }
}
