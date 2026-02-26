import { JwtAuthGuard } from '@/services/identity-ms/guards/jwt.guard';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import type { User } from '../model/user.entity';
import { UserService } from '../services/user.service';
import { UserController } from './user.controller';

describe('UserController', () => {
  let controller: UserController;
  let userService: {
    findById: ReturnType<typeof vi.fn>;
    updateUser: ReturnType<typeof vi.fn>;
    deleteUser: ReturnType<typeof vi.fn>;
    toResponse: ReturnType<typeof vi.fn>;
  };
  const eventBus = { send: vi.fn() };

  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    password_hash: 'hashed',
    avatar_url: null,
    metadata: null,
    is_email_verified: false,
    created_at: undefined,
    updated_at: undefined,
    userRoles: [],
    is_deleted: false,
    is_active: false,
    is_suspended: false,
  };

  const req: { user: { sub: string; email: string } } = {
    user: {
      sub: 'user-1',
      email: 'test@example.com',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: {
            findById: vi.fn(),
            updateUser: vi.fn(),
            deleteUser: vi.fn(),
            toResponse: vi.fn().mockReturnValue({ id: mockUser.id }),
          },
        },
        { provide: 'EVENT_BUS', useValue: eventBus },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: vi.fn().mockReturnValue(true) })
      .compile();

    controller = module.get(UserController);
    userService = module.get(UserService);
    vi.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should return current user from request', async () => {
      const result = await controller.getProfile(req);
      expect(result).toEqual(req.user);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const updateData = {
        email: mockUser.email,
        first_name: 'New Name',
        last_name: 'New Last Name',
        password_hash: mockUser.password_hash,
        avatar_url: 'https://example.com/avatar.png',
        metadata: { job: 'dev' },
        ...mockUser,
      } as Partial<User> & { password?: string };

      userService.findById.mockResolvedValue({ ...mockUser });
      userService.updateUser.mockResolvedValue({ ...mockUser, ...updateData });
      const result = await controller.updateProfile(req, updateData);

      expect(result).toEqual({
        message: 'Profile updated successfully',
        user: { id: mockUser.id },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      userService.findById.mockResolvedValue(null);

      await expect(controller.updateProfile(req, {})).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if email is changed', async () => {
      userService.findById.mockResolvedValue(mockUser);

      await expect(controller.updateProfile(req, { email: 'new@example.com' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException if password is changed', async () => {
      userService.findById.mockResolvedValue(mockUser);

      await expect(
        controller.updateProfile(req, {
          password: 'new-hash',
          email: mockUser.email,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('deleteProfile', () => {
    it('should delete user successfully', async () => {
      userService.findById.mockResolvedValue(mockUser);
      eventBus.send
        .mockReturnValueOnce(of(true))
        .mockReturnValueOnce(of(true))
        .mockReturnValueOnce(of(true));

      const result = await controller.deleteProfile(req, mockUser.id);

      expect(eventBus.send).toHaveBeenNthCalledWith(1, 'permission.canAccessResource', {
        action: 'delete:profile',
        reqUserId: mockUser.id,
        userId: req.user.sub,
      });
      expect(eventBus.send).toHaveBeenNthCalledWith(2, 'user-roles.deleteUserRole', {
        user_id: mockUser.id,
      });
      expect(eventBus.send).toHaveBeenNthCalledWith(3, 'session.deleteByUser', {
        user_id: mockUser.id,
      });
      expect(result).toEqual({
        message: 'Profile deleted successfully',
        user: { id: mockUser.id },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      userService.findById.mockResolvedValue(null);

      await expect(controller.deleteProfile(req, 'nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if access denied', async () => {
      userService.findById.mockResolvedValue(mockUser);
      eventBus.send.mockReturnValueOnce(of(false));

      await expect(controller.deleteProfile(req, mockUser.id)).rejects.toThrow(ForbiddenException);
    });
  });
});
