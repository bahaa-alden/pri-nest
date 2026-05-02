import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthRepository } from './auth.repository';
import { AuthTokensDto } from './dto/auth-tokens.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload, JwtRefreshPayload } from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokensDto> {
    const existing = await this.authRepository.findUserByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await this.hashValue(dto.password);
    const user = await this.authRepository.createUser({
      email: dto.email.toLowerCase(),
      passwordHash,
    });

    return this.issueTokens(user);
  }

  async login(dto: LoginDto): Promise<AuthTokensDto> {
    const user = await this.authRepository.findUserByEmail(dto.email.toLowerCase());
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueTokens(user);
  }

  async refresh(user: Express.User): Promise<AuthTokensDto> {
    const refreshTokenRecord = await this.authRepository.findRefreshTokenById(
      user.refreshTokenId ?? '',
    );
    if (!refreshTokenRecord || refreshTokenRecord.revokedAt) {
      throw new UnauthorizedException('Refresh token is invalid');
    }
    if (refreshTokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const isTokenValid = await bcrypt.compare(
      user.refreshToken ?? '',
      refreshTokenRecord.tokenHash,
    );
    if (!isTokenValid) {
      throw new UnauthorizedException('Refresh token is invalid');
    }

    const account = await this.authRepository.findUserById(user.sub);
    if (!account) {
      throw new UnauthorizedException('User no longer exists');
    }

    const tokens = await this.issueTokens(account);
    const refreshPayload = this.jwtService.decode(tokens.refreshToken) as JwtRefreshPayload;
    await this.authRepository.revokeRefreshToken(refreshTokenRecord.id, refreshPayload.refreshTokenId);
    return tokens;
  }

  async logout(user: Express.User): Promise<void> {
    if (!user.refreshTokenId) {
      return;
    }
    await this.authRepository.revokeRefreshToken(user.refreshTokenId);
  }

  private async issueTokens(user: User): Promise<AuthTokensDto> {
    const accessPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const refreshTokenRecord = await this.authRepository.createRefreshToken({
      userId: user.id,
      tokenHash: 'placeholder',
      expiresAt: this.getRefreshExpiryDate(),
    });

    const refreshPayload: JwtRefreshPayload = {
      ...accessPayload,
      refreshTokenId: refreshTokenRecord.id,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.getOrThrow<string>('JWT_ACCESS_EXPIRES_IN') as never,
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN') as never,
      }),
    ]);

    const tokenHash = await this.hashValue(refreshToken);
    await this.authRepository.updateRefreshTokenHash(refreshTokenRecord.id, tokenHash);

    return { accessToken, refreshToken };
  }

  private getRefreshExpiryDate(): Date {
    const days = Number(this.configService.get<string>('JWT_REFRESH_EXPIRES_DAYS') ?? '30');
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }

  private async hashValue(value: string): Promise<string> {
    const rounds = Number(this.configService.get<string>('BCRYPT_SALT_ROUNDS') ?? '10');
    return bcrypt.hash(value, rounds);
  }
}
