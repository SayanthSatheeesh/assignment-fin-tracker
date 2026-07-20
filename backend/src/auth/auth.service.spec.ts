import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

const mockUser = {
  id: 'uuid-1',
  name: 'Test User',
  email: 'test@test.com',
  password: '$2b$10$hashedpassword',
};

const mockUsersService = {
  findByEmail: jest.fn(),
  create: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('throws ConflictException when email already exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      await expect(
        service.register({
          name: 'Test',
          email: 'test@test.com',
          password: 'pass123',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('hashes password before saving', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(mockUser);
      const bcryptSpy = jest.spyOn(bcrypt, 'hash');

      await service.register({
        name: 'Test',
        email: 'new@test.com',
        password: 'pass123',
      });

      expect(bcryptSpy).toHaveBeenCalledWith('pass123', 10);
    });

    it('returns user without password field', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(mockUser);

      const result = await service.register({
        name: 'Test',
        email: 'new@test.com',
        password: 'pass123',
      });

      expect(result).not.toHaveProperty('password');
    });
  });

  describe('login', () => {
    it('throws UnauthorizedException when user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      await expect(
        service.login({ email: 'noone@test.com', password: 'pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when password does not match', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);
      await expect(
        service.login({ email: 'test@test.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('returns accessToken and safe user on valid credentials', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await service.login({
        email: 'test@test.com',
        password: 'pass123',
      });

      expect(result).toHaveProperty('accessToken', 'mock-jwt-token');
      expect(result.user).not.toHaveProperty('password');
      expect(result.user).toMatchObject({
        id: 'uuid-1',
        email: 'test@test.com',
      });
    });
  });
});
