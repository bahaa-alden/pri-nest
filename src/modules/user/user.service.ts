import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService,
  ) {}

  async createUser(dto: CreateUserDto): Promise<User> {
    const existing = await this.userRepository.findByEmail(dto.email.toLowerCase());
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    return this.userRepository.create({
      email: dto.email.toLowerCase(),
      passwordHash: await this.hashValue(dto.password),
      role: dto.role ?? 'USER',
    });
  }

  async getProfile(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateUser(userId: string, dto: UpdateUserDto): Promise<User> {
    await this.getProfile(userId);
    return this.userRepository.update(userId, {
      ...dto,
      email: dto.email?.toLowerCase(),
    });
  }

  async deleteUser(userId: string): Promise<void> {
    await this.getProfile(userId);
    await this.userRepository.softDelete(userId);
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.getProfile(userId);
    const isCurrentPasswordValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is invalid');
    }

    await this.userRepository.update(userId, {
      passwordHash: await this.hashValue(dto.newPassword),
    });
  }

  findById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email.toLowerCase());
  }

  private async hashValue(value: string): Promise<string> {
    const rounds = Number(this.configService.get<string>('BCRYPT_SALT_ROUNDS') ?? '10');
    return bcrypt.hash(value, rounds);
  }
}
