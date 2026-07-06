import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { CurrentOrg, CurrentUser } from '../../common/decorators/org.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

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

  @Get(':id/on-chain')
  getOnChain(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentOrg() orgId: string,
  ) {
    return this.projectsService.getOnChainAllocation(id, orgId);
  }

  @Get(':id/pipeline-stages')
  getPipelineStages(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentOrg() orgId: string,
  ) {
    return this.projectsService.getPipelineStages(id, orgId);
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

  // ── Registrar transacción (subir factura) ─────────────────────────────────

  /** OCR + extracción con IA — solo prellenar el formulario, no persiste nada. */
  @Post(':id/transactions/ocr')
  @Roles('admin', 'contador', 'responsable')
  @UseInterceptors(FileInterceptor('file'))
  ocrInvoice(@UploadedFile() file: Express.Multer.File) {
    return this.projectsService.extractInvoice(file);
  }

  /** Crea la transacción en estado `pending` (aún sin anclar — requiere aprobación). */
  @Post(':id/transactions')
  @Roles('admin', 'contador', 'responsable')
  @UseInterceptors(FileInterceptor('file'))
  createTransaction(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: CreateTransactionDto,
    @CurrentOrg() orgId: string,
    @CurrentUser() user: { sub: string; role: string },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.projectsService.createTransaction(orgId, user.sub, user.role, id, body, file);
  }

  /** Doble control: un 2º rol aprueba y recién ahí se ancla on-chain. */
  @Patch(':id/transactions/:txId/approve')
  @Roles('admin', 'auditor')
  approveTransaction(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('txId', ParseUUIDPipe) txId: string,
    @CurrentOrg() orgId: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.projectsService.approveTransaction(orgId, user.sub, id, txId);
  }

  /** Rechaza una transacción pendiente (2º rol). */
  @Patch(':id/transactions/:txId/reject')
  @Roles('admin', 'auditor')
  rejectTransaction(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('txId', ParseUUIDPipe) txId: string,
    @CurrentOrg() orgId: string,
    @CurrentUser() user: { sub: string },
  ) {
    return this.projectsService.rejectTransaction(orgId, user.sub, id, txId);
  }
}
