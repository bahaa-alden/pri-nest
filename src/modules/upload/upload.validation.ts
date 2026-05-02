import { BadRequestException } from '@nestjs/common';
import { Request } from 'express';

export const imageFileFilter = (_req: Request, file: Express.Multer.File, callback: (error: Error | null, acceptFile: boolean) => void): void => {
  if (!file.mimetype.startsWith('image/')) {
    callback(new BadRequestException('Only image files are allowed'), false);
    return;
  }
  callback(null, true);
};
