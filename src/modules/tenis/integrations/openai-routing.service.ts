import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ScheduleSlot } from "../tenis.enums";
import { TenisIntent, TenisIntentResult } from "../tenis.intents";

interface AiCacheEntry {
  value: TenisIntentResult;
  expiresAt: number;
}

@Injectable()
export class OpenAiRoutingService {
  private readonly logger = new Logger(OpenAiRoutingService.name);
  private readonly cache = new Map<string, AiCacheEntry>();
  private readonly ttlMs = 10 * 60 * 1000;

  constructor(private readonly configService: ConfigService) {}

  async classify(
    message: string,
    context: Record<string, unknown>,
    cacheKey?: string,
  ): Promise<TenisIntentResult | null> {
    if (!this.isEnabled()) {
      return null;
    }

    const normalized = this.normalize(message);
    if (!normalized) {
      return null;
    }

    const key = cacheKey ? `${cacheKey}:${normalized}` : normalized;
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    const apiKey = this.configService.get<string>("OPENAI_API_KEY") ?? "";
    const model = this.configService.get<string>("OPENAI_MODEL") ?? "gpt-4o-mini";
    if (!apiKey) {
      return null;
    }

    const schema = this.schema();
    const payload = {
      model,
      input: [
        {
          role: "system",
          content:
            "Clasifica intencion para un bot de tenis. Responde solo JSON valido segun schema.",
        },
        {
          role: "user",
          content: JSON.stringify({ message: message.slice(0, 600), context }),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: schema,
      },
    };

    try {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        this.logger.warn(`OpenAI error: ${response.status} ${text}`);
        return null;
      }

      const data = (await response.json()) as Record<string, unknown>;
      const rawText = this.extractText(data);
      if (!rawText) {
        return null;
      }

      const parsed = JSON.parse(rawText) as TenisIntentResult;
      const normalizedResult = this.normalizeResult(parsed);
      this.cache.set(key, {
        value: normalizedResult,
        expiresAt: Date.now() + this.ttlMs,
      });
      return normalizedResult;
    } catch (error) {
      this.logger.warn("OpenAI error", error as Error);
      return null;
    }
  }

  private isEnabled(): boolean {
    const flag = this.configService.get<string>("ENABLE_OPENAI");
    return flag === "true";
  }

  private normalize(value: string): string {
    return value.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 400);
  }

  private extractText(data: Record<string, unknown>): string | null {
    if (typeof data.output_text === "string") {
      return data.output_text;
    }

    const output = data.output as Array<{ content?: Array<{ text?: string }> }> | undefined;
    const text = output?.[0]?.content?.[0]?.text;
    return typeof text === "string" ? text : null;
  }

  private normalizeResult(result: TenisIntentResult): TenisIntentResult {
    const confidence = Number.isFinite(result.confidence) ? result.confidence : 0;
    const intent = Object.values(TenisIntent).includes(result.intent)
      ? result.intent
      : TenisIntent.UNKNOWN;
    const entities = { ...(result.entities ?? {}) };
    if (entities.slot && !Object.values(ScheduleSlot).includes(entities.slot)) {
      entities.slot = undefined;
    }

    return {
      intent,
      confidence,
      entities,
      needs_clarification: Boolean(result.needs_clarification),
      clarifying_question: result.clarifying_question,
    };
  }

  private schema(): Record<string, unknown> {
    return {
      name: "tenis_intent",
      strict: true,
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          intent: {
            type: "string",
            enum: Object.values(TenisIntent),
          },
          confidence: { type: "number" },
          entities: {
            type: "object",
            additionalProperties: false,
            properties: {
              opponent_name: { type: "string" },
              opponent_phone: { type: "string" },
              match_id: { type: "string" },
              report_id: { type: "string" },
              score: { type: "string" },
              date: { type: "string" },
              time: { type: "string" },
              slot: { type: "string", enum: Object.values(ScheduleSlot) },
            },
          },
          needs_clarification: { type: "boolean" },
          clarifying_question: { type: "string" },
        },
        required: ["intent", "confidence", "entities", "needs_clarification"],
      },
    };
  }
}
