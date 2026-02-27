import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { FastifyRequest } from "fastify";
import { PinoLogger } from "nestjs-pino";

@Injectable()
export class WebhookSignatureGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: PinoLogger,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const signatureHeader = request.headers["x-hub-signature-256"];
    const signature = Array.isArray(signatureHeader)
      ? signatureHeader[0]
      : signatureHeader;
    const contentType = request.headers["content-type"];

    const appSecret = this.configService.get<string>("whatsapp.appSecret");
    if (!appSecret || !signature) {
      this.logger.warn({
        event: "webhook.signature.missing",
        hasSecret: Boolean(appSecret),
        hasSignature: Boolean(signature),
        contentType,
      });
      return false;
    }

    const rawBody = (request as FastifyRequest & { rawBody?: Buffer }).rawBody;
    if (!rawBody) {
      this.logger.warn({
        event: "webhook.signature.rawbody_missing",
        hasSignature: Boolean(signature),
        contentType,
      });
      return false;
    }

    const expected = this.createSignature(rawBody, appSecret);
    const ok = this.safeCompare(signature, expected);
    this.logger.info({
      event: "webhook.signature.checked",
      ok,
      contentType,
      rawBodyLength: rawBody.length,
    });
    return ok;
  }

  private createSignature(payload: Buffer, secret: string): string {
    const digest = createHmac("sha256", secret).update(payload).digest("hex");
    return `sha256=${digest}`;
  }

  private safeCompare(left: string, right: string): boolean {
    const leftBuffer = Buffer.from(left, "utf8");
    const rightBuffer = Buffer.from(right, "utf8");
    if (leftBuffer.length !== rightBuffer.length) {
      return false;
    }

    return timingSafeEqual(leftBuffer, rightBuffer);
  }
}
