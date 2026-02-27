import {
  NormalizedEvent,
  NormalizedEventKind,
  NormalizedMessageType,
} from "./parser.types";

import { Injectable } from "@nestjs/common";

type UnknownRecord = Record<string, unknown>;

@Injectable()
export class ParserService {
  parse(payload: unknown): NormalizedEvent[] {
    if (!this.isRecord(payload) || !Array.isArray(payload.entry)) {
      return [this.unknownEvent(payload)];
    }

    const events: NormalizedEvent[] = [];

    for (const entry of payload.entry) {
      if (!this.isRecord(entry) || !Array.isArray(entry.changes)) {
        continue;
      }

      for (const change of entry.changes) {
        if (!this.isRecord(change)) {
          continue;
        }

        const value = this.isRecord(change.value)
          ? (change.value as UnknownRecord)
          : undefined;

        if (!value) {
          continue;
        }

        const metadata = this.isRecord(value.metadata)
          ? (value.metadata as UnknownRecord)
          : undefined;
        const phoneNumberId =
          typeof metadata?.phone_number_id === "string"
            ? metadata.phone_number_id
            : undefined;

        const contacts = Array.isArray(value.contacts) ? value.contacts : [];
        const contact = this.isRecord(contacts[0])
          ? (contacts[0] as UnknownRecord)
          : undefined;
        const contactProfile = this.isRecord(contact?.profile)
          ? (contact?.profile as UnknownRecord)
          : undefined;
        const fromName =
          typeof contactProfile?.name === "string"
            ? contactProfile.name
            : undefined;
        const fromWaId =
          typeof contact?.wa_id === "string" ? contact.wa_id : undefined;

        const messages = Array.isArray(value.messages) ? value.messages : [];
        for (const message of messages) {
          if (!this.isRecord(message)) {
            continue;
          }

          const messageType = this.parseMessageType(message.type);
          const textBody = this.extractTextBody(message);
          const occurredAt = this.toIsoTimestamp(message.timestamp);

          events.push({
            kind: "incoming_message",
            occurredAt,
            phoneNumberId,
            waMessageId:
              typeof message.id === "string" ? message.id : undefined,
            fromWaId:
              typeof message.from === "string" ? message.from : fromWaId,
            fromName,
            messageType,
            text: textBody,
            raw: message,
          });
        }

        const statuses = Array.isArray(value.statuses) ? value.statuses : [];
        for (const status of statuses) {
          if (!this.isRecord(status)) {
            continue;
          }

          events.push({
            kind: "message_status",
            occurredAt: this.toIsoTimestamp(status.timestamp),
            phoneNumberId,
            waMessageId: typeof status.id === "string" ? status.id : undefined,
            fromWaId:
              typeof status.recipient_id === "string"
                ? status.recipient_id
                : undefined,
            status:
              typeof status.status === "string" ? status.status : undefined,
            raw: status,
          });
        }
      }
    }

    if (events.length === 0) {
      events.push(this.unknownEvent(payload));
    }

    return events;
  }

  private parseMessageType(value: unknown): NormalizedMessageType {
    if (value === "text") return "text";
    if (value === "image") return "image";
    if (value === "audio") return "audio";
    if (value === "document") return "document";
    if (value === "interactive") return "interactive";
    return "unknown";
  }

  private extractTextBody(message: UnknownRecord): string | undefined {
    const text = this.isRecord(message.text) ? message.text : undefined;
    return typeof text?.body === "string" ? text.body : undefined;
  }

  private toIsoTimestamp(value: unknown): string {
    if (typeof value === "string" || typeof value === "number") {
      const numeric = Number(value);
      if (!Number.isNaN(numeric) && Number.isFinite(numeric)) {
        return new Date(numeric * 1000).toISOString();
      }
    }

    return new Date().toISOString();
  }

  private unknownEvent(payload: unknown): NormalizedEvent {
    return {
      kind: "unknown",
      occurredAt: new Date().toISOString(),
      raw: payload,
    };
  }

  private isRecord(value: unknown): value is UnknownRecord {
    return typeof value === "object" && value !== null;
  }
}
