import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class DeleteUploadDto {
  @ApiProperty({
    description: 'Cloudinary public ID of the file to delete',
    example: 'folder/filename',
  })
  @IsString()
  publicId!: string;
}
