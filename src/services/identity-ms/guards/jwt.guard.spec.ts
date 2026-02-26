import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt.guard';
import { TokenService } from '../modules/token/services/token.service';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;
  let tokenService: TokenService;

  const mockRequest = (headers: Record<string, string>) => ({
    headers,
  });

  const mockContext = (headers: Record<string, string>) =>
    ({
      switchToHttp: () => ({
        getRequest: () => mockRequest(headers),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as Reflector;

    tokenService = {
      verifyAccessToken: jest.fn(),
    } as unknown as TokenService;

    guard = new JwtAuthGuard(reflector, tokenService);
  });

  it('should allow access to public route', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(true);
    const context = mockContext({});
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('should throw if Authorization header is missing', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    const context = mockContext({});
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw if Authorization header is malformed', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    const context = mockContext({ authorization: 'InvalidToken' });
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw if token verification fails', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    (tokenService.verifyAccessToken as jest.Mock).mockRejectedValue(new Error('invalid'));
    const context = mockContext({ authorization: 'Bearer badtoken' });
    await expect(guard.canActivate(context)).rejects.toThrow('Invalid token');
  });

  it('should throw if token is expired', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    const error = new Error('Token expired');
    (error as any).name = 'TokenExpiredError';
    (tokenService.verifyAccessToken as jest.Mock).mockRejectedValue(error);
    const context = mockContext({ authorization: 'Bearer expiredtoken' });
    await expect(guard.canActivate(context)).rejects.toThrow('Token expired');
  });

  it('should allow access if token is valid', async () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    (tokenService.verifyAccessToken as jest.Mock).mockResolvedValue({ sub: 'user-id' });
    const context = mockContext({ authorization: 'Bearer validtoken' });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });
});
