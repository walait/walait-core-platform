import { randomUUID } from "node:crypto";
import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Header,
  HttpCode,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Inject } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { FastifyRequest } from "fastify";
import { WebhookSignatureGuard } from "./webhook-signature.guard";
import { WebhookService } from "./webhook.service";

@Controller()
export class WebhookController {
  constructor(
    @Inject(ConfigService)
    private readonly configService: ConfigService,
    @Inject(WebhookService)
    private readonly webhookService: WebhookService,
  ) {}

  @Get("webhook")
  @Header("content-type", "text/plain")
  verifyWebhook(
    @Query("hub.mode") mode?: string,
    @Query("hub.verify_token") token?: string,
    @Query("hub.challenge") challenge?: string,
  ): string {
    const expectedToken = this.configService.get<string>(
      "whatsapp.verifyToken",
    );

    if (
      mode === "subscribe" &&
      token &&
      expectedToken &&
      token === expectedToken
    ) {
      return challenge ?? "";
    }

    throw new ForbiddenException();
  }

  @Post("webhook")
  @UseGuards(WebhookSignatureGuard)
  @HttpCode(200)
  handleWebhook(@Body() body: unknown, @Req() request: FastifyRequest) {
    const requestId = this.getRequestId(request);
    const metadata = {
      requestId,
      sourceIp: request.ip,
      userAgent: request.headers["user-agent"],
    };

    void this.webhookService
      .handleWebhook(body, { ...metadata })
      .catch((error) => {
        console.error(
          JSON.stringify({
            requestId,
            error: error instanceof Error ? error.message : "Unknown error",
          }),
        );
      });

    return { ok: true };
  }

  private getRequestId(request: FastifyRequest): string {
    const headerId = request.headers["x-request-id"];
    if (typeof headerId === "string" && headerId.length > 0) {
      return headerId;
    }

    return randomUUID();
  }
}
