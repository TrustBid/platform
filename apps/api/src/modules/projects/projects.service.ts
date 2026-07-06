import { Injectable, Inject, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { createHash } from 'crypto';
import type { Pool } from 'pg';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DB_POOL } from '../../database/database.module';
import { SorobanService } from '../soroban/soroban.service';
import { StorageService } from '../storage/storage.service';
import { GeminiService } from '../ai/gemini.service';
import type { CreateProjectDto } from './dto/create-project.dto';
import type { UpdateProjectDto } from './dto/update-project.dto';
import type { CreateTransactionDto } from './dto/create-transaction.dto';

/** Roles con autoridad de aprobación: su carga directa se auto-autoriza y ancla al instante. */
const APPROVER_ROLES = ['admin', 'admin_regional', 'auditor'];

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    @Inject(DB_POOL) private readonly pool: Pool,
    private readonly soroban: SorobanService,
    private readonly storage: StorageService,
    private readonly gemini: GeminiService,
    private readonly events: EventEmitter2,
  ) {}

  async listByOrg(orgId: string) {
    const result = await this.pool.query<{
      id: string;
      name: string;
      category: string;
      status: string;
      description: string | null;
      beneficiary: string | null;
      budget_amount: string;
      spent_amount: string;
      budget_asset: string;
      blockchain_enabled: boolean;
      start_date: Date | null;
      end_date: Date | null;
      current_stage: string | null;
      allocation_tx_hash: string | null;
      blockchain_status: string | null;
      created_at: Date;
    }>(
      `SELECT
         p.id, p.name, p.category, p.status, p.description, p.beneficiary,
         p.budget_amount, p.spent_amount, p.budget_asset, p.blockchain_enabled,
         p.allocation_tx_hash, p.blockchain_status,
         p.start_date, p.end_date, p.created_at,
         (SELECT ps.name FROM pipeline_stages ps WHERE ps.id = p.current_stage_id) AS current_stage
       FROM projects p
       WHERE p.organization_id = $1
         AND p.status != 'archived'
       ORDER BY p.created_at DESC`,
      [orgId],
    );

    return result.rows.map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      status: r.status,
      description: r.description ?? '',
      beneficiary: r.beneficiary ?? '',
      budgetAmount: Number(r.budget_amount),
      spentAmount: Number(r.spent_amount),
      budgetAsset: r.budget_asset,
      blockchainEnabled: r.blockchain_enabled,
      startDate: r.start_date ?? null,
      endDate: r.end_date ?? null,
      currentStage: r.current_stage ?? '',
      allocationTxHash: r.allocation_tx_hash ?? null,
      blockchainStatus: r.blockchain_status ?? null,
      createdAt: r.created_at.toISOString(),
    }));
  }

  async getById(id: string, orgId: string) {
    const result = await this.pool.query(
      `SELECT p.*,
         (SELECT ps.name FROM pipeline_stages ps WHERE ps.id = p.current_stage_id) AS current_stage
       FROM projects p
       WHERE p.id = $1 AND p.organization_id = $2`,
      [id, orgId],
    );
    if (!result.rows[0]) throw new NotFoundException({ code: 'not_found', message: 'Project not found' });
    const r = result.rows[0];
    return {
      id: r.id,
      name: r.name,
      description: r.description,
      beneficiary: r.beneficiary,
      category: r.category,
      status: r.status,
      budget_amount: r.budget_amount,
      spent_amount: r.spent_amount,
      budget_asset: r.budget_asset,
      blockchain_enabled: r.blockchain_enabled,
      allocation_tx_hash: r.allocation_tx_hash ?? null,
      blockchain_status: r.blockchain_status ?? null,
      start_date: r.start_date,
      end_date: r.end_date,
      current_stage: r.current_stage ?? null,
      created_at: r.created_at,
    };
  }

  async getOnChainAllocation(id: string, orgId: string) {
    await this.getById(id, orgId);
    return this.soroban.readAllocation(id);
  }

  async update(id: string, orgId: string, dto: UpdateProjectDto) {
    const before = await this.pool.query<{
      budget_amount: string;
      blockchain_enabled: boolean;
    }>(
      `SELECT budget_amount, blockchain_enabled FROM projects WHERE id = $1 AND organization_id = $2`,
      [id, orgId],
    );
    if (!before.rows[0]) {
      throw new NotFoundException({ code: 'not_found', message: 'Project not found' });
    }

    // Mapa columna → valor; solo se actualizan las claves presentes en el DTO.
    // Los nombres de columna son literales (no input del usuario) → sin riesgo de inyección.
    const columns: Record<string, unknown> = {
      name: dto.name,
      description: dto.description,
      beneficiary: dto.beneficiary,
      category: dto.category,
      status: dto.status,
      budget_amount: dto.budgetAmount,
      budget_asset: dto.budgetAsset,
      start_date: dto.startDate,
      end_date: dto.endDate,
      blockchain_enabled: dto.blockchainEnabled,
    };

    const setClauses: string[] = [];
    const values: unknown[] = [];
    for (const [col, val] of Object.entries(columns)) {
      if (val !== undefined) {
        values.push(val);
        setClauses.push(`${col} = $${values.length}`);
      }
    }

    // Sin campos para actualizar → devolver el estado actual (también valida existencia/scope).
    if (setClauses.length === 0) return this.getById(id, orgId);

    setClauses.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id, orgId);

    const result = await this.pool.query(
      `UPDATE projects
         SET ${setClauses.join(', ')}
       WHERE id = $${values.length - 1} AND organization_id = $${values.length}
       RETURNING id`,
      values,
    );
    if (!result.rows[0]) throw new NotFoundException({ code: 'not_found', message: 'Project not found' });

    const prev = before.rows[0];
    const budgetChanged =
      dto.budgetAmount !== undefined &&
      Number(prev.budget_amount) !== dto.budgetAmount;
    const blockchainOn =
      dto.blockchainEnabled ?? prev.blockchain_enabled;

    if (budgetChanged && blockchainOn) {
      const orgRow = await this.pool.query<{ wallet_address: string | null }>(
        `SELECT wallet_address FROM organizations WHERE id = $1`,
        [orgId],
      );
      const callerPublicKey =
        orgRow.rows[0]?.wallet_address ??
        (process.env.STELLAR_SERVER_PUBLIC_KEY ??
          'GAOJ53SVIVOVP4O376PZBPTZRWHC5ML5JV4PSV26GT56MQSRR2J25EQO');

      const txHash = await this.soroban.allocateFunds(
        id,
        dto.budgetAmount!,
        callerPublicKey,
      );
      if (txHash) {
        await this.pool.query(
          `UPDATE projects SET allocation_tx_hash = $1, blockchain_status = 'anchored' WHERE id = $2`,
          [txHash, id],
        );
        this.logger.log(`Re-allocation anchored project=${id} tx=${txHash}`);
      } else {
        await this.pool.query(
          `UPDATE projects SET blockchain_status = 'failed' WHERE id = $1`,
          [id],
        );
        this.logger.warn(`Re-allocation failed project=${id}`);
      }
    }

    return this.getById(id, orgId);
  }

  async getTransactions(projectId: string, orgId: string) {
    const result = await this.pool.query<{
      id: string;
      memo_id: string;
      tx_hash: string | null;
      amount: string;
      asset_code: string;
      status: string;
      executed_at: Date | null;
      description: string | null;
      settlement_type: string | null;
      ai_match: boolean | null;
      created_by: string | null;
    }>(
      // Aliaseamos las columnas reales del esquema a los nombres que espera el front
      // (la tabla usa tx_status / confirmed_at / concept, no status/executed_at/description).
      `SELECT t.id, t.memo_id, t.tx_hash, t.amount, t.asset_code,
              t.tx_status AS status, t.confirmed_at AS executed_at, t.concept AS description,
              t.settlement_type, t.ai_match, t.created_by
       FROM transactions t
       JOIN projects p ON p.id = t.project_id
       WHERE t.project_id = $1
         AND p.organization_id = $2
       ORDER BY t.created_at DESC
       LIMIT 100`,
      [projectId, orgId],
    );
    return result.rows;
  }

  // Actividad reciente de la organización: últimas transacciones de todos los proyectos.
  async getRecentActivity(orgId: string, limit = 10) {
    const result = await this.pool.query<{
      id: string;
      project_id: string | null;
      project_name: string | null;
      concept: string;
      amount: string;
      asset_code: string;
      tx_status: string;
      tx_hash: string | null;
      occurred_at: Date;
    }>(
      `SELECT t.id, t.project_id, p.name AS project_name,
              t.concept, t.amount, t.asset_code, t.tx_status, t.tx_hash,
              COALESCE(t.confirmed_at, t.created_at) AS occurred_at
       FROM transactions t
       LEFT JOIN projects p ON p.id = t.project_id
       WHERE t.organization_id = $1
       ORDER BY COALESCE(t.confirmed_at, t.created_at) DESC
       LIMIT $2`,
      [orgId, limit],
    );

    return result.rows.map((r) => ({
      id: r.id,
      projectId: r.project_id,
      projectName: r.project_name,
      concept: r.concept,
      amount: Number(r.amount),
      assetCode: r.asset_code,
      status: r.tx_status,
      txHash: r.tx_hash,
      occurredAt: r.occurred_at.toISOString(),
    }));
  }

  async getPipelineStages(projectId: string, orgId: string) {
    const result = await this.pool.query<{
      id: string;
      name: string;
      description: string | null;
      order_index: number;
      current_stage_order: number;
    }>(
      `SELECT ps.id, ps.name, ps.description, ps.order_index,
              (SELECT p2.current_stage_id FROM projects p2 WHERE p2.id = $1) AS current_stage_id,
              (SELECT ps2.order_index FROM pipeline_stages ps2 WHERE ps2.id = (SELECT p2.current_stage_id FROM projects p2 WHERE p2.id = $1)) AS current_stage_order
       FROM pipeline_stages ps
       WHERE ps.project_id = $1
         AND ps.organization_id = $2
       ORDER BY ps.order_index ASC`,
      [projectId, orgId],
    );

    return result.rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      orderIndex: r.order_index,
      status:
        r.order_index < r.current_stage_order ? 'completed' :
        r.order_index === r.current_stage_order ? 'current' :
        'pending',
    }));
  }

  async create(orgId: string, userId: string, dto: CreateProjectDto) {
    const result = await this.pool.query<{ id: string; created_at: Date }>(
      `INSERT INTO projects
         (organization_id, name, description, beneficiary, category, status,
          budget_amount, budget_asset, blockchain_enabled, start_date, end_date, created_by)
       VALUES ($1,$2,$3,$4,$5,'draft',$6,$7,$8,$9,$10,$11)
       RETURNING id, created_at`,
      [
        orgId,
        dto.name,
        dto.description ?? null,
        dto.beneficiary ?? null,
        dto.category,
        dto.budgetAmount,
        dto.budgetAsset ?? 'USDC',
        dto.blockchainEnabled ?? true,
        dto.startDate ?? null,
        dto.endDate ?? null,
        userId,
      ],
    );

    const project = {
      id: result.rows[0].id as string,
      createdAt: result.rows[0].created_at.toISOString() as string,
      allocationTxHash: null as string | null,
    };

    if (dto.blockchainEnabled ?? true) {
      // Usar wallet de la org como caller (I-15); fallback al servidor si aún no tiene wallet
      const orgRow = await this.pool.query<{ wallet_address: string | null }>(
        `SELECT wallet_address FROM organizations WHERE id = $1`,
        [orgId],
      );
      const callerPublicKey =
        orgRow.rows[0]?.wallet_address ??
        (process.env.STELLAR_SERVER_PUBLIC_KEY ?? 'GAOJ53SVIVOVP4O376PZBPTZRWHC5ML5JV4PSV26GT56MQSRR2J25EQO');

      const txHash = await this.soroban.allocateFunds(
        project.id,
        dto.budgetAmount,
        callerPublicKey,
      );
      if (txHash) {
        project.allocationTxHash = txHash;
        await this.pool.query(
          `UPDATE projects SET allocation_tx_hash = $1, blockchain_status = 'anchored' WHERE id = $2`,
          [txHash, project.id],
        );
        this.logger.log(`Allocation anchored project=${project.id} tx=${txHash} caller=${callerPublicKey}`);
      } else {
        await this.pool.query(
          `UPDATE projects SET blockchain_status = 'failed' WHERE id = $1`,
          [project.id],
        );
        this.logger.warn(`Allocation failed project=${project.id} org=${orgId}`);
      }
    }

    return project;
  }

  /**
   * OCR + extracción de una factura vía Gemini. No persiste nada — solo devuelve
   * los campos detectados para prellenar el formulario de "Registrar transacción".
   */
  async extractInvoice(file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException({ code: 'no_file', message: 'Se requiere un archivo (campo "file")' });
    }
    const extraction = await this.gemini.extractInvoice(file.buffer, file.mimetype);
    return {
      enabled: this.gemini.enabled,
      extraction, // null si la IA está deshabilitada o falló
    };
  }

  /**
   * Registra una transacción (gasto/factura) en estado `pending`.
   *
   * - Guarda el comprobante en R2 (content-addressed por su SHA-256).
   * - Valida el contenido con IA: compara el monto declarado vs el extraído → ai_match.
   * - NO ancla on-chain acá: el anclaje ocurre recién al aprobar (doble control).
   */
  async createTransaction(
    orgId: string,
    userId: string,
    creatorRole: string,
    projectId: string,
    dto: CreateTransactionDto,
    file?: Express.Multer.File,
    submitterPhone?: string,
  ) {
    const project = await this.pool.query(
      `SELECT id FROM projects WHERE id = $1 AND organization_id = $2`,
      [projectId, orgId],
    );
    if (!project.rows[0]) {
      throw new BadRequestException({ code: 'invalid_project', message: 'Project not found in your organization' });
    }

    // Comprobante → hash SHA-256 (fingerprint) + almacenamiento inmutable en R2.
    let supportFileHash: string | null = null;
    let storageKey: string | null = null;
    if (file) {
      supportFileHash = createHash('sha256').update(file.buffer).digest('hex');
      storageKey = await this.storage.putInvoice(file.buffer, supportFileHash, file.mimetype);
      if (!storageKey && this.storage.enabled) {
        this.logger.warn(`putInvoice devolvió null pese a R2 habilitado (hash=${supportFileHash})`);
      }
    }

    // Validación de contenido con IA: monto de la factura vs monto declarado.
    let aiExtracted: unknown = null;
    let aiAmount: number | null = null;
    let aiMatch: boolean | null = null;
    let aiConfidence: number | null = null;
    let aiFlags: string | null = null;
    if (file) {
      const extraction = await this.gemini.extractInvoice(file.buffer, file.mimetype);
      if (extraction) {
        aiExtracted = extraction;
        aiAmount = extraction.amount;
        aiConfidence = extraction.confidence;
        if (typeof aiAmount === 'number' && aiAmount > 0) {
          // Tolerancia 1% para redondeos/impuestos menores.
          const diff = Math.abs(aiAmount - dto.amount);
          aiMatch = diff <= Math.max(0.01, dto.amount * 0.01);
          if (!aiMatch) {
            aiFlags = `amount_mismatch: declarado=${dto.amount} factura=${aiAmount}`;
          }
        } else {
          aiFlags = 'amount_not_detected';
        }
      }
    }

    const settlementType = dto.settlementType ?? 'on_chain';

    // PAY-YYYY-NNNN — memo_id es único globalmente (mismo esquema que public.service.ts)
    const year = new Date().getFullYear();
    const countResult = await this.pool.query<{ n: string }>(
      `SELECT COUNT(*) AS n FROM transactions WHERE EXTRACT(YEAR FROM created_at) = $1`,
      [year],
    );
    const n = Number(countResult.rows[0]?.n ?? 0) + 1;
    const memoId = `PAY-${year}-${String(n).padStart(4, '0')}`;

    const result = await this.pool.query<{ id: string; created_at: Date }>(
      `INSERT INTO transactions
         (organization_id, project_id, beneficiary, concept, category, amount, asset_code,
          memo_id, tx_status, support_file_hash, storage_key, invoice_number, tax_id,
          invoice_date, settlement_type, ai_extracted, ai_amount, ai_match, ai_confidence,
          ai_flags, created_by, submitter_phone)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending',$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
       RETURNING id, created_at`,
      [
        orgId,
        projectId,
        dto.beneficiary,
        dto.concept,
        dto.category,
        dto.amount,
        dto.assetCode ?? 'USDC',
        memoId,
        supportFileHash,
        storageKey,
        dto.invoiceNumber ?? null,
        dto.taxId ?? null,
        dto.invoiceDate ?? null,
        settlementType,
        aiExtracted ? JSON.stringify(aiExtracted) : null,
        aiAmount,
        aiMatch,
        aiConfidence,
        aiFlags,
        userId,
        submitterPhone ?? null,
      ],
    );

    const txId = result.rows[0].id;

    // Un rol con autoridad de aprobación (admin) que carga la factura DIRECTO se
    // auto-autoriza → se ancla al instante (Flujo 1, dashboard). Si la crea otro
    // (voluntario por bot, contador) queda `pending` y requiere que un aprobador
    // DISTINTO la valide (doble control — Flujo 2).
    const selfAuthorized = APPROVER_ROLES.includes(creatorRole);
    if (selfAuthorized) {
      await this.pool.query(
        `UPDATE transactions
            SET tx_status = 'submitted', approved_by = $1, approved_at = CURRENT_TIMESTAMP
          WHERE id = $2`,
        [userId, txId],
      );
      this.anchorTransactionAsync({
        txId,
        projectId,
        orgId,
        amount: dto.amount,
        concept: dto.concept,
        supportFileHash,
      });
      this.logger.log(`Transaction ${txId} creada por ${creatorRole} → auto-anclando (self-authorized)`);
    } else {
      this.logger.log(`Transaction ${txId} creada (pending, requiere aprobación) por ${creatorRole}`);
    }

    return {
      id: txId,
      memoId,
      status: selfAuthorized ? 'submitted' : 'pending',
      createdAt: result.rows[0].created_at.toISOString(),
      supportFileHash,
      settlementType,
      ai: { amount: aiAmount, match: aiMatch, confidence: aiConfidence, flags: aiFlags },
    };
  }

  /**
   * Anclaje on-chain fire-and-forget (expense-anchor) + actualización de estado.
   * Reusado por el auto-anclaje del admin (createTransaction) y por approveTransaction.
   */
  private anchorTransactionAsync(opts: {
    txId: string;
    projectId: string;
    orgId: string;
    amount: number;
    concept: string;
    supportFileHash: string | null;
  }): void {
    this.pool
      .query<{ wallet_address: string | null }>(
        `SELECT wallet_address FROM organizations WHERE id = $1`,
        [opts.orgId],
      )
      .then((orgRow) => {
        const callerPublicKey =
          orgRow.rows[0]?.wallet_address ??
          (process.env.STELLAR_SERVER_PUBLIC_KEY ?? 'GAOJ53SVIVOVP4O376PZBPTZRWHC5ML5JV4PSV26GT56MQSRR2J25EQO');
        const receiptHash =
          opts.supportFileHash ??
          createHash('sha256').update(`${opts.txId}:${opts.concept}:${opts.amount}`).digest('hex');
        return this.soroban.anchorExpenseWithRetry({
          expenseId: opts.txId,
          projectId: opts.projectId,
          amountXlm: opts.amount,
          receiptHash,
          callerPublicKey,
        });
      })
      .then(async (txHash) => {
        if (txHash) {
          await this.pool
            .query(
              `UPDATE transactions SET tx_hash = $1, tx_status = 'confirmed', confirmed_at = CURRENT_TIMESTAMP WHERE id = $2`,
              [txHash, opts.txId],
            )
            .catch((e) => this.logger.error('tx_hash update failed', e));
          this.logger.log(`Transaction ${opts.txId} anchored on-chain tx=${txHash}`);
          // Notificación al voluntario (bot WhatsApp): si la tx tiene teléfono, emitir evento.
          const info = await this.pool
            .query<{ submitter_phone: string | null; memo_id: string | null }>(
              `SELECT submitter_phone, memo_id FROM transactions WHERE id = $1`,
              [opts.txId],
            )
            .catch(() => null);
          const row = info?.rows[0];
          if (row?.submitter_phone) {
            this.events.emit('transaction.anchored', {
              txHash,
              submitterPhone: row.submitter_phone,
              memoId: row.memo_id,
            });
          }
        } else {
          this.pool
            .query(`UPDATE transactions SET tx_status = 'failed' WHERE id = $1`, [opts.txId])
            .catch((e) => this.logger.error('tx_status failed update error', e));
        }
      })
      .catch((e) => this.logger.error('anchorTransactionAsync failed', e));
  }

  /**
   * Doble control: un rol distinto al creador aprueba la transacción y RECIÉN AHÍ se
   * ancla on-chain (expense-anchor). Devuelve el estado resultante.
   */
  async approveTransaction(
    orgId: string,
    approverUserId: string,
    projectId: string,
    txId: string,
  ) {
    const txRes = await this.pool.query<{
      id: string;
      amount: string;
      concept: string;
      support_file_hash: string | null;
      tx_status: string;
      created_by: string;
    }>(
      `SELECT id, amount, concept, support_file_hash, tx_status, created_by
         FROM transactions
        WHERE id = $1 AND project_id = $2 AND organization_id = $3`,
      [txId, projectId, orgId],
    );
    const tx = txRes.rows[0];
    if (!tx) {
      throw new NotFoundException({ code: 'tx_not_found', message: 'Transacción no encontrada' });
    }
    if (tx.tx_status !== 'pending') {
      throw new BadRequestException({ code: 'not_pending', message: `La transacción ya está en estado ${tx.tx_status}` });
    }
    // Regla de doble control: el aprobador no puede ser el creador.
    if (tx.created_by === approverUserId) {
      throw new ForbiddenException({
        code: 'self_approval',
        message: 'El aprobador debe ser un usuario distinto al que registró la transacción',
      });
    }

    await this.pool.query(
      `UPDATE transactions
          SET approved_by = $1, approved_at = CURRENT_TIMESTAMP, tx_status = 'submitted'
        WHERE id = $2`,
      [approverUserId, txId],
    );

    this.anchorTransactionAsync({
      txId,
      projectId,
      orgId,
      amount: Number(tx.amount),
      concept: tx.concept,
      supportFileHash: tx.support_file_hash,
    });

    return { id: txId, status: 'submitted', approvedBy: approverUserId };
  }

  /** Rechaza una transacción pendiente (segundo rol). No se ancla nada. */
  async rejectTransaction(
    orgId: string,
    approverUserId: string,
    projectId: string,
    txId: string,
  ) {
    const res = await this.pool.query(
      `UPDATE transactions
          SET tx_status = 'failed', approved_by = $1, approved_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND project_id = $3 AND organization_id = $4 AND tx_status = 'pending'
        RETURNING id`,
      [approverUserId, txId, projectId, orgId],
    );
    if (!res.rows[0]) {
      throw new NotFoundException({ code: 'tx_not_found', message: 'Transacción pendiente no encontrada' });
    }
    return { id: txId, status: 'failed' };
  }
}
