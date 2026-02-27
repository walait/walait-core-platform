import { TokenService } from "@/modules/identity/application/token.service";
import { IUserRequest } from "@/modules/identity/domain/user.interface";
import { IS_PUBLIC_KEY } from "@/shared/decorators/public.decorator";
import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

interface CustomRequest {
  headers?: Record<string, string | undefined>;
  user?: IUserRequest;
}

@Injectable({})
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokenService: TokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<CustomRequest>();
    const authHeader = request.headers?.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException(
        "Missing or invalid Authorization header",
      );
    }

    const token = authHeader.split(" ")[1];

    try {
      const payload: IUserRequest =
        await this.tokenService.verifyAccessToken(token);
      request.user = payload;
      return true;
    } catch (error: unknown) {
      const errorName =
        error && typeof error === "object" && "name" in error
          ? String((error as { name?: unknown }).name)
          : "";
      if (errorName === "TokenExpiredError") {
        throw new UnauthorizedException("Token expired");
      }
      throw new UnauthorizedException("Invalid token");
    }
  }
}
