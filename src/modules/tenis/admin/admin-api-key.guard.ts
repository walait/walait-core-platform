import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AdminApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const headerKey = request.headers["x-admin-api-key"];
    const apiKey =
      typeof headerKey === "string"
        ? headerKey
        : Array.isArray(headerKey)
          ? headerKey[0]
          : undefined;
    const expected = this.configService.get<string>("ADMIN_API_KEY") ?? "";

    if (!expected || !apiKey) {
      return false;
    }

    return apiKey === expected;
  }
}
