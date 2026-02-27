import { ParserService } from './parser.service';

describe('ParserService', () => {
  const parser = new ParserService();

  it('parses incoming text messages', () => {
    const payload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: '123456',
          changes: [
            {
              field: 'messages',
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: '15551234567',
                  phone_number_id: '987654',
                },
                contacts: [
                  {
                    profile: { name: 'Jane Doe' },
                    wa_id: '5491112345678',
                  },
                ],
                messages: [
                  {
                    from: '5491112345678',
                    id: 'wamid.HBgMNTQ5MTExMjM0NTY3OA==',
                    timestamp: '1710000000',
                    type: 'text',
                    text: { body: 'Hola' },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const events = parser.parse(payload);

    expect(events).toHaveLength(1);
    expect(events[0]).toEqual(
      expect.objectContaining({
        kind: 'incoming_message',
        phoneNumberId: '987654',
        waMessageId: 'wamid.HBgMNTQ5MTExMjM0NTY3OA==',
        fromWaId: '5491112345678',
        fromName: 'Jane Doe',
        messageType: 'text',
        text: 'Hola',
        occurredAt: new Date(1710000000 * 1000).toISOString(),
      }),
    );
  });

  it('parses message statuses', () => {
    const payload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: '123456',
          changes: [
            {
              field: 'messages',
              value: {
                metadata: {
                  phone_number_id: '987654',
                },
                statuses: [
                  {
                    id: 'wamid.status123',
                    status: 'delivered',
                    timestamp: 1710001000,
                    recipient_id: '5491112345678',
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const events = parser.parse(payload);

    expect(events).toHaveLength(1);
    expect(events[0]).toEqual(
      expect.objectContaining({
        kind: 'message_status',
        phoneNumberId: '987654',
        waMessageId: 'wamid.status123',
        fromWaId: '5491112345678',
        status: 'delivered',
        occurredAt: new Date(1710001000 * 1000).toISOString(),
      }),
    );
  });

  it('returns unknown event when payload does not match', () => {
    const payload = { foo: 'bar' };
    const events = parser.parse(payload);

    expect(events).toHaveLength(1);
    expect(events[0].kind).toBe('unknown');
  });
});
