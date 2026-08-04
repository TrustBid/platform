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

/** Motivo por el que no se pudo extraer. Permite dar un mensaje útil al usuario. */
export type ExtractionFailure =
  | 'disabled' // sin GOOGLE_API_KEY
  | 'quota' // 429 / RESOURCE_EXHAUSTED — cuota agotada
  | 'unreadable' // la IA respondió pero sin datos utilizables
  | 'error'; // cualquier otro fallo (red, 5xx, parseo)

export interface ExtractionResult {
  data: InvoiceExtraction | null;
  failure: ExtractionFailure | null;
}

/**
 * Modelo por defecto. OJO: `gemini-2.0-flash` quedó con cuota 0 en el free tier
 * (429 RESOURCE_EXHAUSTED permanente), por eso el default apunta a 2.5-flash.
 * Se puede sobreescribir con GEMINI_MODEL.
 */
const DEFAULT_MODEL = 'gemini-2.5-flash';
/** Modelo de respaldo cuando el principal devuelve 429. */
const DEFAULT_FALLBACK_MODEL = 'gemini-3.5-flash-lite';

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
  private readonly fallbackModel: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('GOOGLE_API_KEY');
    this.model = this.config.get<string>('GEMINI_MODEL') ?? DEFAULT_MODEL;
    this.fallbackModel =
      this.config.get<string>('GEMINI_FALLBACK_MODEL') ?? DEFAULT_FALLBACK_MODEL;
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
    const { data } = await this.extractInvoiceDetailed(buffer, mimeType);
    return data;
  }

  /**
   * Igual que `extractInvoice`, pero informa *por qué* falló. Lo usa el bot para
   * distinguir "cuota agotada" de "factura ilegible" y avisarle al voluntario.
   *
   * Reintenta una vez ante 429/5xx y, si persiste el 429, cae al modelo de respaldo.
   */
  async extractInvoiceDetailed(
    buffer: Buffer,
    mimeType: string,
  ): Promise<ExtractionResult> {
    if (!this.client) return { data: null, failure: 'disabled' };

    const attempts: { model: string; waitMs: number }[] = [
      { model: this.model, waitMs: 0 },
      { model: this.model, waitMs: 1500 },
      { model: this.fallbackModel, waitMs: 0 },
    ];

    let lastFailure: ExtractionFailure = 'error';
    for (const [i, attempt] of attempts.entries()) {
      if (attempt.waitMs) await new Promise((r) => setTimeout(r, attempt.waitMs));
      try {
        const parsed = await this.callModel(attempt.model, buffer, mimeType);
        if (!parsed) {
          lastFailure = 'unreadable';
          continue;
        }
        if (i > 0) {
          this.logger.warn(`extractInvoice resuelto en el intento ${i + 1} (modelo=${attempt.model})`);
        }
        return { data: parsed, failure: null };
      } catch (err: unknown) {
        lastFailure = this.classify(err);
        this.logger.error(
          `extractInvoice falló (modelo=${attempt.model}, intento=${i + 1}, causa=${lastFailure}): ${this.describe(err)}`,
        );
        // Sin cuota ni disponibilidad → vale la pena reintentar. El resto, no.
        if (lastFailure !== 'quota' && lastFailure !== 'error') break;
      }
    }
    return { data: null, failure: lastFailure };
  }

  /** Una llamada al modelo. Lanza si la API falla; devuelve null si no hay texto. */
  private async callModel(
    model: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<InvoiceExtraction | null> {
    const response = await this.client!.models.generateContent({
      model,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text:
                'Sos un asistente contable en Latinoamérica. Extraé los datos de esta factura o recibo.\n' +
                'MONTO: devolvé el TOTAL a pagar como número puro, sin símbolo de moneda ni separadores de miles.\n' +
                'IMPORTANTE con el formato numérico latinoamericano: el PUNTO suele ser separador de MILES y la ' +
                'COMA el separador DECIMAL. Ejemplos: "1.130.500" → 1130500 · "1.130.500,75" → 1130500.75 · ' +
                '"450.000" → 450000 · "1,234.56" (formato anglosajón) → 1234.56. Ante la duda, usá el subtotal y ' +
                'los impuestos del comprobante para verificar que el total sea coherente.\n' +
                'currency: el código ISO de la moneda si aparece (COP, CRC, USD, ARS…); null si no figura.\n' +
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
        // El OCR es extracción, no razonamiento: apagar el "thinking" evita gastar
        // el presupuesto de salida en tokens de pensamiento (respuestas vacías) y
        // reduce el consumo de cuota varias veces.
        thinkingConfig: { thinkingBudget: 0 },
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
  }

  /** Traduce el error de la API a un motivo accionable. */
  private classify(err: unknown): ExtractionFailure {
    const status = (err as { status?: number })?.status;
    const text = this.describe(err);
    if (status === 429 || /RESOURCE_EXHAUSTED|quota|rate limit/i.test(text)) {
      return 'quota';
    }
    return 'error';
  }

  private describe(err: unknown): string {
    if (err instanceof Error) return err.message.slice(0, 400);
    return String(err).slice(0, 400);
  }
}
