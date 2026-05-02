import { Inject, Injectable } from '@nestjs/common';
import { UploadApiResponse, v2 as Cloudinary } from 'cloudinary';

@Injectable()
export class UploadService {
  constructor(@Inject('CLOUDINARY') private readonly cloudinary: typeof Cloudinary) {}

  async uploadImage(file: Express.Multer.File, folder = 'uploads'): Promise<UploadApiResponse> {
    const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    return this.cloudinary.uploader.upload(base64, {
      folder,
      resource_type: 'image',
    });
  }

  async deleteImage(publicId: string): Promise<void> {
    await this.cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
  }
}
