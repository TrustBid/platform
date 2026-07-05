import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * StorageService — almacenamiento inmutable de comprobantes en Cloudflare R2
 * (API S3-compatible). Las facturas se guardan *content-addressed* por su hash
 * SHA-256, de modo que la clave cambia si el contenido cambia → la integridad
 * anclada on-chain siempre es re-verificable.
 *
 * Degrada con gracia: si faltan credenciales R2, `enabled=false` y `putInvoice`
 * devuelve null (el flujo sigue, sin persistencia remota).
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client | null;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    const accountId = this.config.get<string>('R2_ACCOUNT_ID');
    const accessKeyId = this.config.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.config.get<string>('R2_SECRET_ACCESS_KEY');
    this.bucket = this.config.get<string>('R2_BUCKET') ?? 'trustbid-invoices';

    if (accountId && accessKeyId && secretAccessKey) {
      this.client = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: { accessKeyId, secretAccessKey },
      });
    } else {
      this.client = null;
      this.logger.warn(
        'Credenciales R2 ausentes — almacenamiento de comprobantes deshabilitado (modo degradado).',
      );
    }
  }

  get enabled(): boolean {
    return this.client !== null;
  }

  /**
   * Sube el comprobante a R2 con clave content-addressed `invoices/<sha256>`.
   * Devuelve la clave, o null si R2 no está configurado / falla.
   */
  async putInvoice(
    buffer: Buffer,
    sha256: string,
    mimeType: string,
  ): Promise<string | null> {
    if (!this.client) return null;
    const key = `invoices/${sha256}`;
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: buffer,
          ContentType: mimeType,
        }),
      );
      return key;
    } catch (err: unknown) {
      this.logger.error(
        `putInvoice failed key=${key}`,
        err instanceof Error ? err.stack : err,
      );
      return null;
    }
  }

  /** URL firmada temporal para que un auditor descargue y re-verifique el comprobante. */
  async getSignedUrl(key: string, expiresInSeconds = 300): Promise<string | null> {
    if (!this.client) return null;
    try {
      return await getSignedUrl(
        this.client,
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
        { expiresIn: expiresInSeconds },
      );
    } catch (err: unknown) {
      this.logger.error(
        `getSignedUrl failed key=${key}`,
        err instanceof Error ? err.stack : err,
      );
      return null;
    }
  }
}
