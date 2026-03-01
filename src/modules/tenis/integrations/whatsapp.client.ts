import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ScheduleOption } from "../entities/schedule-option.entity";

interface ChallengeRequestPayload {
  challengeId: string;
  challengerName: string;
}

interface ScheduleOptionsPayload {
  matchId: string;
  options: ScheduleOption[];
}

interface ResultConfirmationPayload {
  reportId: string;
  score: string;
}

@Injectable()
export class WhatsAppClient {
  private readonly logger = new Logger(WhatsAppClient.name);

  constructor(private readonly configService: ConfigService) {}

  async sendTextMessage(to: string, text: string): Promise<void> {
    if (!this.isEnabled()) {
      this.logger.debug(`WhatsApp outbound disabled: ${text}`);
      return;
    }

    await this.sendMessage({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text, preview_url: false },
    });
  }

  async sendChallengeRequest(to: string, payload: ChallengeRequestPayload): Promise<void> {
    const body = `Tenes un desafio de ${payload.challengerName}.`;
    await this.sendButtonsMessage(to, body, [
      { id: `challenge_accept:${payload.challengeId}`, title: "Confirmar" },
      { id: `challenge_reject:${payload.challengeId}`, title: "Rechazar" },
    ]);
  }

  async sendScheduleOptions(to: string, payload: ScheduleOptionsPayload): Promise<void> {
    const rows = payload.options.map((option) => ({
      id: `schedule_select:${option.id}`,
      title: option.label,
    }));

    await this.sendListMessage(to, {
      title: "Opciones de agenda",
      body: "Selecciona una opcion de agenda:",
      rows,
    });
  }

  async sendResultConfirmation(to: string, payload: ResultConfirmationPayload): Promise<void> {
    const body = `Resultado reportado: ${payload.score}. Confirmas?`;
    await this.sendButtonsMessage(to, body, [
      { id: `result_confirm:${payload.reportId}`, title: "Confirmar" },
      { id: `result_reject:${payload.reportId}`, title: "Rechazar" },
    ]);
  }

  async sendButtonsMessage(
    to: string,
    bodyText: string,
    buttons: { id: string; title: string }[],
  ): Promise<void> {
    if (!this.isEnabled()) {
      this.logger.debug(`WhatsApp outbound disabled: ${bodyText}`);
      return;
    }

    await this.sendMessage({
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: bodyText },
        action: {
          buttons: buttons.slice(0, 3).map((button) => ({
            type: "reply",
            reply: { id: button.id, title: button.title },
          })),
        },
      },
    });
  }

  async sendListMessage(
    to: string,
    payload: {
      title: string;
      body: string;
      rows: { id: string; title: string; description?: string }[];
    },
  ): Promise<void> {
    if (!this.isEnabled()) {
      this.logger.debug(`WhatsApp outbound disabled: ${payload.title}`);
      return;
    }

    await this.sendMessage({
      messaging_product: "whatsapp",
      to,
      type: "interactive",
      interactive: {
        type: "list",
        body: { text: payload.body },
        action: {
          button: "Seleccionar",
          sections: [
            {
              title: payload.title,
              rows: payload.rows,
            },
          ],
        },
      },
    });
  }

  private isEnabled(): boolean {
    const flag = this.configService.get<string>("ENABLE_WHATSAPP_OUTBOUND");
    return flag === "true";
  }

  private async sendMessage(payload: Record<string, unknown>): Promise<void> {
    const accessToken =
      this.configService.get<string>("META_ACCESS_TOKEN") ??
      this.configService.get<string>("WHATSAPP_ACCESS_TOKEN") ??
      "";
    const phoneNumberId =
      this.configService.get<string>("META_PHONE_NUMBER_ID") ??
      this.configService.get<string>("WHATSAPP_PHONE_NUMBER_ID") ??
      "";
    const apiVersion = this.configService.get<string>("META_API_VERSION") ?? "v19.0";

    if (!accessToken || !phoneNumberId) {
      this.logger.warn("WhatsApp outbound sin credenciales configuradas.");
      return;
    }

    const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      this.logger.error(`WhatsApp send failed: ${response.status} ${text}`);
    }
  }
}
