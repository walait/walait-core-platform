import { randomUUID } from "node:crypto";
import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { FastifyReply, FastifyRequest } from "fastify";
import { WebhookSignatureGuard } from "./webhook-signature.guard";
import { WebhookService } from "./webhook.service";

@Controller()
export class WebhookController {
  constructor(
    private readonly configService: ConfigService,
    private readonly webhookService: WebhookService,
  ) {}

  @Get("webhook")
  @Header("content-type", "text/plain")
  verifyWebhook(
    @Res() reply: FastifyReply,
    @Query("hub.mode") mode?: string,
    @Query("hub.verify_token") token?: string,
    @Query("hub.challenge") challenge?: string,
  ): void {
    const expectedToken = this.configService.get<string>(
      "whatsapp.verifyToken",
    );

    if (
      mode === "subscribe" &&
      token &&
      expectedToken &&
      token === expectedToken
    ) {
      console.log(
        JSON.stringify({
          event: "webhook.verify.success",
          mode,
          hasChallenge: Boolean(challenge),
        }),
      );
      const response = String(challenge ?? "");
      reply.type("text/plain").code(200).send(response);
      return;
    }

    console.warn(
      JSON.stringify({
        event: "webhook.verify.failed",
        mode,
        tokenPresent: Boolean(token),
        expectedTokenPresent: Boolean(expectedToken),
      }),
    );

    reply.type("text/plain").code(403).send("");
    return;
  }

  @Post("webhook")
  @UseGuards(WebhookSignatureGuard)
  @HttpCode(200)
  handleWebhook(@Body() body: unknown, @Req() request: FastifyRequest): void {
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

    return;
  }

  private getRequestId(request: FastifyRequest): string {
    const headerId = request.headers["x-request-id"];
    if (typeof headerId === "string" && headerId.length > 0) {
      return headerId;
    }

    return randomUUID();
  }
}
