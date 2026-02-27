import { JwtAuthGuard } from "@/modules/identity/interfaces/guards/jwt.guard";
import {
  Controller,
  Delete,
  Get,
  Inject,
  NotFoundException,
  Param,
  Req,
  UseGuards,
  UsePipes,
} from "@nestjs/common";
import { ZodValidationPipe } from "nestjs-zod";
import { SessionService } from "../../application/session.service";
import { UserService } from "../../application/user.service";
import { IUserRequest } from "../../domain/user.interface";

@UsePipes(ZodValidationPipe)
@Controller("session")
export class SessionController {
  constructor(
    private readonly userService: UserService,
    private readonly sessionService: SessionService,
  ) {}

  @Get("sessions")
  @UseGuards(JwtAuthGuard)
  async getSessions(@Req() req: { user: IUserRequest }) {
    const user = await this.userService.findById(req.user.sub);
    if (!user) throw new NotFoundException("User not found");
    const sessions = await this.sessionService.getAllActiveSessions(user.id);
    if (!sessions || !sessions.length)
      throw new NotFoundException("No active sessions found");

    return {
      message: "Active sessions retrieved successfully",
      user: this.userService.toResponse(user),
      sessions,
    };
  }

  @Delete("sessions/:sessionId")
  @UseGuards(JwtAuthGuard)
  async deleteSession(
    @Req() req: { user: IUserRequest },
    @Param("sessionId") sessionId: string,
  ) {
    const user = await this.userService.findById(req.user.sub);
    if (!user) throw new NotFoundException("User not found");
    const session = await this.sessionService.getActiveSessionById(
      req.user.sid,
    );
    if (!session) throw new NotFoundException("Session not found");

    await this.sessionService.revokeSession(sessionId);

    return {
      message: "Session revoked successfully",
      session: this.sessionService.toResponse(session, {
        access_token: "",
        refresh_token: "",
        expires_at: new Date(),
      }),
    };
  }
}
