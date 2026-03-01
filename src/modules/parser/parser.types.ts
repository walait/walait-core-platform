export type NormalizedEventKind = "incoming_message" | "message_status" | "unknown";

export type NormalizedMessageType =
  | "text"
  | "image"
  | "audio"
  | "document"
  | "interactive"
  | "unknown";

export interface NormalizedInteractive {
  type: "button" | "list" | "unknown";
  id?: string;
  title?: string;
}

export interface NormalizedEvent {
  kind: NormalizedEventKind;
  occurredAt: string;
  phoneNumberId?: string;
  waMessageId?: string;
  fromWaId?: string;
  fromName?: string;
  messageType?: NormalizedMessageType;
  text?: string;
  interactive?: NormalizedInteractive;
  status?: string;
  raw: unknown;
}
