import { ApiProperty } from '@nestjs/swagger';
import { Role, User } from '@prisma/client';

export class UserEntity {
  @ApiProperty({ description: 'User ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ description: 'User email address', example: 'user@example.com' })
  email: string;

  @ApiProperty({ description: 'User role', enum: Role, example: 'USER' })
  role: Role;

  @ApiProperty({
    description: 'User avatar URL',
    example: 'https://example.com/avatar.jpg',
    nullable: true,
  })
  avatarUrl: string | null;

  @ApiProperty({ description: 'Whether user account is active', example: true })
  isActive: boolean;

  @ApiProperty({ description: 'Account creation timestamp', example: '2026-05-02T19:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Account last update timestamp', example: '2026-05-02T19:00:00.000Z' })
  updatedAt: Date;

  constructor(user: User) {
    this.id = user.id;
    this.email = user.email;
    this.role = user.role;
    this.avatarUrl = user.avatarUrl;
    this.isActive = user.isActive;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }
}
