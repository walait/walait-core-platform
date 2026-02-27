export type NormalizedEventKind = 'incoming_message' | 'message_status' | 'unknown';

export type NormalizedMessageType =
  | 'text'
  | 'image'
  | 'audio'
  | 'document'
  | 'interactive'
  | 'unknown';

export interface NormalizedEvent {
  kind: NormalizedEventKind;
  occurredAt: string;
  phoneNumberId?: string;
  waMessageId?: string;
  fromWaId?: string;
  fromName?: string;
  messageType?: NormalizedMessageType;
  text?: string;
  status?: string;
  raw: unknown;
}
