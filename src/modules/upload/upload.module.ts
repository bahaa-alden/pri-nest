import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { cloudinaryProvider } from './cloudinary.provider';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

@Module({
  imports: [UserModule],
  controllers: [UploadController],
  providers: [UploadService, cloudinaryProvider],
  exports: [UploadService],
})
export class UploadModule {}
