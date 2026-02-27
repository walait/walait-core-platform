import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class WebhookSignatureGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // TODO: Implement X-Hub-Signature-256 validation with Meta app secret.
    // This requires access to the raw request body before JSON parsing.
    void context;
    return true;
  }
}
