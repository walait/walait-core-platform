import { Controller, Inject, Injectable, Post } from "@nestjs/common";
import { XMLParser } from "fast-xml-parser";
import { WsaaService } from "../../infrastructure/ar/afip/auth/wsaa/service/wsaa.service";

@Injectable()
@Controller("wsaa")
export class WsaaController {
  constructor(@Inject(WsaaService) private readonly wsaaService: WsaaService) {}

  @Post("token")
  async generateTA() {
    const { token, sign, expirationTime } =
      await this.wsaaService.getAuthorizationTicket("wsfev1", "20415118334");

    return { token, sign, expirationTime };
  }
}
