import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const ClientInfo = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): { userAgent: string; ipAddress: string } => {
    const req = ctx.switchToHttp().getRequest();
    return {
      userAgent: req.headers['user-agent'] as string,
      ipAddress:
        (req.headers['x-forwarded-for'] as string) ||
        (req.ip as string) ||
        (req.connection.remoteAddress as string),
    };
  },
);
