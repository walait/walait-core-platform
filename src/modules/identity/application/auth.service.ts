import { EmailTemplate } from '@/modules/email/domain/email.enum';
import { Organization } from '@/modules/organization/domain/model/organization.entity';
import {
  Body,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService as ConfigServiceToken } from '@nestjs/config';
import type { ConfigService } from '@nestjs/config';
import type { ClientProxy } from '@nestjs/microservices';
import { hash } from 'argon2';
import { firstValueFrom } from 'rxjs';
import { DataSource as DataSourceToken } from 'typeorm';
import type { DataSource } from 'typeorm';
import type { Session } from '../domain/model/session.entity';
import type { User } from '../domain/model/user.entity';
import type { IUserRequest } from '../domain/user.interface';
import type { SignInInput, SignUpInput } from '../interfaces/schemas/auth.schema';
import { PasswordService as PasswordServiceToken } from './password.service';
import type { PasswordService } from './password.service';
import { SessionService as SessionServiceToken } from './session.service';
import type { SessionService } from './session.service';
import { TokenService as TokenServiceToken } from './token.service';
import type { TokenService } from './token.service';
import { UserService as UserServiceToken } from './user.service';
import type { UserService } from './user.service';
@Injectable()
export class AuthService {
  constructor(
    @Inject(DataSourceToken)
    private readonly dataSource: DataSource,
    @Inject(UserServiceToken)
    private readonly userService: UserService,
    @Inject(SessionServiceToken)
    private readonly sessionService: SessionService,
    @Inject(TokenServiceToken)
    private readonly tokenService: TokenService,
    @Inject(PasswordServiceToken)
    private readonly passwordService: PasswordService,
    @Inject('EVENT_BUS') private client: ClientProxy,
    @Inject(ConfigServiceToken)
    private readonly configService: ConfigService,
  ) {}

  async signIn(data: SignInInput, client: { ipAddress: string; userAgent: string }) {
    const user = await this.validateSignIn(data, client);

    const session = await this.createSession(user.id, client.ipAddress, client.userAgent);

    const membership = await firstValueFrom(
      this.client.send('membership.getMembershipAndOrgById', {
        user_id: user.id,
      }),
    );

    this.sendEmailIfNotValidateAccount(user, client.ipAddress);

    const tokens = await this.generateCredentials(user, session, membership);

    this.client.send('audit.user.logged_in', {
      user_id: user.id,
      email: user.email,
      organization_id: membership.organization?.id ?? 'global',
      role: membership.role ?? 'member',
      session_id: session.id,
      ip_address: client.ipAddress,
      user_agent: client.userAgent,
      timestamp: new Date().toISOString(),
    });

    return {
      user: this.userService.toResponse(user),
      session: this.sessionService.toResponse(session, tokens),
      require_email_verification: !user.is_email_verified,
    };
  }

  async signUp(data: SignUpInput, client: { ipAddress: string; userAgent: string }) {
    await this.validateSignUp(data);

    const user = await this.userService.createUser(data);

    this.client.send('audit.user.created', {
      user_id: user.id,
      email: user.email,
      timestamp: new Date().toISOString(),
    });

    await this.createSession(user.id, client.ipAddress, client.userAgent);

    const { membership, organization } = await this.validateOrganizationAndMembership({
      ...data,
      user,
    });

    await this.assignRole({ user, membership, organization, isGlobalAdmin: data.is_global_admin });

    const emailTokenExpiration = new Date(Date.now() + 60 * 60 * 1000);

    const emailToken = await this.tokenService.generateToken(
      {
        user,
        expires_at: emailTokenExpiration,
      },
      process.env.EMAIL_VERIFICATION_SECRET,
      '1h',
    );

    await firstValueFrom(
      this.client.send('email.verification_requested', {
        user_id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        organization_id: membership.organization.id,
        organization_slug: membership.organization.slug,
        domain: membership.organization.domain,
        token: emailToken,
        token_expiration_at: emailTokenExpiration,
        template_slug: EmailTemplate.CONFIRM_ACCOUNT,
      }),
    );

    // const verification = await this.verificationService.createToken(
    //   user.id,
    //   emailToken,
    //   emailTokenExpiration,
    //   manager,
    // );

    // // ← aquí iría el envío de email real (emailService.sendEmailVerification)

    // if (!verification) {
    //   throw new NotFoundException('Verification token not found');
    // }

    // const template = await this.emailService.getTemplateBySlug(
    //   EmailTemplate.CONFIRM_ACCOUNT.replace('{company}', 'walait').replace('{language}', 'es'),
    // );

    // if (!template) {
    //   throw new NotFoundException('Email template not found');
    // }
    // let verificationLink = `${process.env.BACKEND_URL}/api/email-ms/verify-email?token=${verification.token}`;
    // if (membership.organization.domain) {
    //   verificationLink = `${process.env.BACKEND_URL}/api/email-ms/verify-email?token=${verification.token}&organization_id=${membership.organization.id}`;
    // }
    // await this.emailService.sendEmailWithTemplate(template, user.email, 'Confirm your account', {
    //   firstName: user.first_name,
    //   lastName: user.last_name,
    //   verification_link: verificationLink,
    //   app_name: membership.organization.slug || 'WalaTech',
    // });

    return {
      user: this.userService.toResponse(user),
    };
  }

  async refreshToken(data: { refresh_token: string }) {
    const decoded = this.tokenService.decodePayload<IUserRequest>(data.refresh_token);

    const session = await this.sessionService.getActiveSessionById(decoded.sid);
    if (!session) throw new UnauthorizedException('Invalid session');

    await this.validateRefreshToken(session, data.refresh_token, decoded);

    const user = session.user;

    const membership = await firstValueFrom(
      this.client.send('membership.getMembershipAndOrgById', {
        user_id: user.id,
      }),
    );
    const tokens = await this.generateCredentials(user, session, membership);

    this.client.send('audit.user.token_refreshed', {
      user_id: user.id,
      organization_id: membership.organization?.id ?? 'global',
      session_id: session.id,
      timestamp: new Date().toISOString(),
    });

    return {
      user: this.userService.toResponse(user),
      session: this.sessionService.toResponse(session, tokens),
    };
  }

  async logout(sessionId: string) {
    return this.sessionService.revokeSession(sessionId);
  }

  //#region utilities
  private sendEmailIfNotValidateAccount(user: User, ipAddress: string) {
    if (!user.is_email_verified) {
      this.client.send('email.login_pending_verification', {
        user_id: user.id,
        email: user.email,
        ip_address: ipAddress,
        timestamp: new Date().toISOString(),
      });
    }
  }

  private async generateCredentials(user: User, session: Session, membership) {
    const tokens = await this.generateTokens({
      sub: user.id,
      sid: session.id,
      email: user.email,
      organization_id: membership.organization?.id ?? 'global',
      role: membership.role ?? 'member',
    });

    await this.sessionService.updateWithNewTokens(
      session.id,
      await hash(tokens.refresh_token),
      tokens.sessionSecret,
      7 * 24 * 60 * 60 * 1000,
    );

    this.client.send('audit.session.refreshed', {
      session_id: session.id,
      user_id: user.id,
      ip_address: session.ip_address,
      user_agent: session.user_agent,
      refreshed_at: new Date().toISOString(),
    });

    return tokens;
  }

  private async createSession(userId: string, ipAddress: string, userAgent: string) {
    const session = await this.sessionService.create(userId, {
      user_agent: userAgent,
      ip_address: ipAddress,
    });

    this.client.send('audit.session.created', {
      session_id: session.id,
      user_id: userId,
      ip_address: ipAddress,
      user_agent: userAgent,
      expires_at: session.expires_at,
    });

    return session;
  }

  private async validateSignIn(
    { email, password }: SignInInput,
    { ipAddress, userAgent }: { ipAddress: string; userAgent: string },
  ) {
    const user = await this.userService.findByEmail(email, true);
    if (!user) throw new NotFoundException('User not found');

    const valid = await this.passwordService.checkPassword(user.password_hash, password);

    if (!valid) {
      this.client.send('audit.user.login_failed', {
        email,
        ip_address: ipAddress,
        user_agent: userAgent,
        timestamp: new Date().toISOString(),
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const activeSession = await this.sessionService.getActiveByUser(user.id);

    if (
      activeSession &&
      (activeSession.ip_address !== ipAddress || activeSession.user_agent !== userAgent)
    ) {
      this.client.send('audit.user.login_conflict', {
        user_id: user.id,
        active_session_id: activeSession.id,
        new_ip: ipAddress,
        new_user_agent: userAgent,
        timestamp: new Date().toISOString(),
      });
      throw new ConflictException('User already logged in');
    }

    return user;
  }

  private async validateSignUp(data: SignUpInput) {
    const allowGlobal = this.configService.get<boolean>('ALLOW_GLOBAL_SIGN_UP');
    const globalSecretKey = this.configService.get<string>('GLOBAL_SECRET_KEY');
    if (await this.userService.existsByEmail(data.email)) {
      throw new ConflictException('Email already registered');
    }

    if (!data.organization_id) {
      throw new ConflictException('Organization ID is required');
    }

    if (data.is_global_admin && (!allowGlobal || data.global_admin_key !== globalSecretKey)) {
      throw new ForbiddenException('Not authorized to create global admin');
    }
  }

  private async generateTokens(payload: IUserRequest) {
    const sessionSecret = this.tokenService.generateSessionSecret();

    const [access_token, refresh_token] = await Promise.all([
      this.tokenService.generateAccessToken(payload),
      this.tokenService.generateRefreshToken(payload, sessionSecret),
    ]);

    return {
      access_token,
      refresh_token,
      sessionSecret,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };
  }

  private async validateOrganizationAndMembership({
    organization_id,
    role,
    user,
  }: SignUpInput & { user: User }) {
    const organization = await firstValueFrom(
      this.client.send('organizations.getById', {
        organization_id,
      }),
    );

    if (!organization) {
      throw new ConflictException('Organization not exists');
    }

    if (!organization.is_active) {
      throw new UnprocessableEntityException(
        'Organization not allowed or inactive, contact to administration',
      );
    }

    const membership = await firstValueFrom(
      this.client.send('membership.createMembership', {
        user_id: user.id,
        organization,
      }),
    );

    this.client.send('audit.organization.membership_added', {
      user_id: user.id,
      organization_id: organization.id,
      role,
      timestamp: new Date().toISOString(),
    });

    return { organization, membership };
  }

  private async assignRole({
    isGlobalAdmin,
    user,
    organization,
    membership,
  }: {
    user: User;
    isGlobalAdmin: boolean;
    membership;
    organization;
  }) {
    await firstValueFrom(
      this.client.send('user-roles.createUserRole', {
        isGlobalAdmin,
        user_id: user.id,
        role_name: membership?.role,
        organization_id: organization?.id,
      }),
    );

    this.client.send('audit.user.assigned_initial_role', {
      user_id: user.id,
      organization_id: organization.id,
      is_global_admin: isGlobalAdmin,
      role: membership.role,
      timestamp: new Date().toISOString(),
    });
  }
  private async validateRefreshToken(session: Session, token: string, decoded: IUserRequest) {
    try {
      await this.tokenService.verifyRefreshToken(token, session.session_secret);
    } catch {
      this.client.send('audit.session.refresh_failed', {
        reason: 'invalid_signature',
        session_id: decoded.sid,
        user_id: decoded.sub,
        timestamp: new Date().toISOString(),
      });
      throw new UnauthorizedException('Invalid refresh token signature');
    }

    const isValid = await this.sessionService.verifyTokenHash(session, token);
    if (!isValid) {
      this.client.send('audit.session.refresh_failed', {
        reason: 'hash_mismatch',
        session_id: decoded.sid,
        user_id: decoded.sub,
        timestamp: new Date().toISOString(),
      });
      throw new UnauthorizedException('Refresh token hash mismatch');
    }

    if (session.expires_at < new Date()) {
      this.client.send('audit.session.refresh_failed', {
        reason: 'expired',
        session_id: decoded.sid,
        user_id: decoded.sub,
        timestamp: new Date().toISOString(),
      });
      throw new UnauthorizedException('Refresh token expired');
    }
  }

  //#endregion
}
