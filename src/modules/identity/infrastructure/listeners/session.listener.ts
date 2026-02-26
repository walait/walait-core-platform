import { Controller, Global, Injectable } from '@nestjs/common';
// email-ms/listeners/email-verification.listener.ts
import { MessagePattern } from '@nestjs/microservices';

import type { ConfigService } from '@nestjs/config';
import type { SessionService } from '../../application/session.service';

type SessionDeleteByUserIdEvent = {
  user_id: string;
};

@Global()
@Controller()
export class SessionRmqListener {
  constructor(
    private readonly sessionService: SessionService,
    private readonly config: ConfigService,
  ) {}

  @MessagePattern('session.deleteByUser', { async: true })
  async handleSessionDeleteByUserId(event: SessionDeleteByUserIdEvent) {
    const { user_id } = event;

    await this.sessionService.deleteSessionByUserId(user_id);
  }
}
