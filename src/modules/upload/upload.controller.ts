import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { User } from '../shared/decorators/user.decorator';
import { JwtAuthGuard } from '../shared/guards/jwt-auth.guard';
import { UserService } from '../user/user.service';
import { DeleteUploadDto } from './dto/delete-upload.dto';
import { UploadService } from './upload.service';
import { imageFileFilter } from './upload.validation';

@Controller({ path: 'uploads', version: '1' })
@ApiTags('Uploads')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly userService: UserService,
  ) {}

  @Post('single')
  @ApiOperation({ summary: 'Upload a single image file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file (max 5MB)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Image uploaded successfully',
    schema: {
      example: {
        url: 'https://example.com/image.jpg',
        publicId: 'uploads/single/filename',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid file format or size' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: imageFileFilter,
    }),
  )
  async uploadSingle(@UploadedFile() file: Express.Multer.File) {
    const result = await this.uploadService.uploadImage(file, 'uploads/single');
    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  }

  @Post('multiple')
  @ApiOperation({ summary: 'Upload multiple image files (max 10)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Image files (max 10, each 5MB)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Images uploaded successfully',
    schema: {
      example: [
        {
          url: 'https://example.com/image1.jpg',
          publicId: 'uploads/multiple/filename1',
        },
      ],
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid file format or size' })
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: imageFileFilter,
    }),
  )
  async uploadMultiple(@UploadedFiles() files: Express.Multer.File[]) {
    const results = await Promise.all(
      files.map((file) => this.uploadService.uploadImage(file, 'uploads/multiple')),
    );
    return results.map((item) => ({
      url: item.secure_url,
      publicId: item.public_id,
    }));
  }

  @Post('avatar')
  @ApiOperation({ summary: 'Upload user avatar and update profile' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Avatar image file (max 5MB)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Avatar uploaded and profile updated successfully',
    schema: {
      example: {
        url: 'https://example.com/avatar.jpg',
        publicId: 'uploads/avatar/filename',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid file format or size' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: imageFileFilter,
    }),
  )
  async uploadAvatar(@User('sub') userId: string, @UploadedFile() file: Express.Multer.File) {
    const result = await this.uploadService.uploadImage(file, 'uploads/avatar');
    await this.userService.updateUser(userId, { avatarUrl: result.secure_url });
    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  }

  @Post('delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an uploaded image' })
  @ApiResponse({ status: 204, description: 'Image deleted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid public ID' })
  async delete(@Body() dto: DeleteUploadDto): Promise<void> {
    await this.uploadService.deleteImage(dto.publicId);
  }
}
