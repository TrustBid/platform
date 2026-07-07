import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI, Type } from '@google/genai';

/** Campos que la IA intenta extraer de una factura/recibo. */
export interface InvoiceExtraction {
  vendor: string | null;
  amount: number | null;
  currency: string | null;
  invoiceDate: string | null; // YYYY-MM-DD
  invoiceNumber: string | null;
  taxId: string | null;
  confidence: number | null; // 0..1
}

/**
 * GeminiService — OCR + extracción estructurada de facturas vía Google AI Studio.
 *
 * Degrada con gracia: si no hay GOOGLE_API_KEY el servicio queda deshabilitado
 * (extractInvoice → null) y el flujo de transacción sigue funcionando sin validación IA.
 * Corre server-side; la API key nunca llega al navegador.
 */
@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly client: GoogleGenAI | null;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('GOOGLE_API_KEY');
    this.model = this.config.get<string>('GEMINI_MODEL') ?? 'gemini-2.0-flash';
    if (apiKey) {
      this.client = new GoogleGenAI({ apiKey });
    } else {
      this.client = null;
      this.logger.warn(
        'GOOGLE_API_KEY ausente — extracción de facturas con IA deshabilitada (modo degradado).',
      );
    }
  }

  get enabled(): boolean {
    return this.client !== null;
  }

  /**
   * Extrae los campos de una factura (imagen o PDF). Devuelve null si la IA está
   * deshabilitada o si la llamada falla (nunca lanza — no debe bloquear el registro).
   */
  async extractInvoice(
    buffer: Buffer,
    mimeType: string,
  ): Promise<InvoiceExtraction | null> {
    if (!this.client) return null;

    try {
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: [
          {
            role: 'user',
            parts: [
              {
                text:
                  'Sos un asistente contable. Extraé los datos de esta factura o recibo. ' +
                  'Devolvé el monto TOTAL a pagar como número (sin símbolo de moneda ni separadores de miles). ' +
                  'La fecha en formato YYYY-MM-DD. Si un campo no está presente, devolvé null. ' +
                  'confidence es tu confianza global de 0 a 1 en la lectura.',
              },
              {
                inlineData: {
                  mimeType,
                  data: buffer.toString('base64'),
                },
              },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              vendor: { type: Type.STRING, nullable: true },
              amount: { type: Type.NUMBER, nullable: true },
              currency: { type: Type.STRING, nullable: true },
              invoiceDate: { type: Type.STRING, nullable: true },
              invoiceNumber: { type: Type.STRING, nullable: true },
              taxId: { type: Type.STRING, nullable: true },
              confidence: { type: Type.NUMBER, nullable: true },
            },
            required: ['vendor', 'amount', 'confidence'],
          },
        },
      });

      const text = response.text;
      if (!text) return null;
      const parsed = JSON.parse(text) as Partial<InvoiceExtraction>;

      return {
        vendor: parsed.vendor ?? null,
        amount: typeof parsed.amount === 'number' ? parsed.amount : null,
        currency: parsed.currency ?? null,
        invoiceDate: parsed.invoiceDate ?? null,
        invoiceNumber: parsed.invoiceNumber ?? null,
        taxId: parsed.taxId ?? null,
        confidence:
          typeof parsed.confidence === 'number' ? parsed.confidence : null,
      };
    } catch (err: unknown) {
      this.logger.error(
        'extractInvoice failed',
        err instanceof Error ? err.stack : err,
      );
      return null;
    }
  }
}
