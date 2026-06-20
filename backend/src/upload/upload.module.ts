import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

// Map the (allowlisted) declared mimetype to a safe stored extension. We NEVER
// trust the user-supplied original filename extension, which could be .html and
// turn an image/HTML polyglot into stored XSS when served from /uploads.
const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
};
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    MulterModule.register({
      storage: diskStorage({
        destination: (req, file, cb) => {
          // Determine upload folder based on field name
          const uploadPath = join(process.cwd(), 'uploads');
          if (file.fieldname === 'avatar') {
            cb(null, join(uploadPath, 'avatars'));
          } else if (file.fieldname === 'productImage') {
            cb(null, join(uploadPath, 'products'));
          } else {
            cb(null, uploadPath);
          }
        },
        filename: (req, file, cb) => {
          // Extension comes from the allowlisted mimetype, never originalname.
          const ext = MIME_TO_EXT[file.mimetype] || 'jpg';
          cb(null, `${uuidv4()}.${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        // Only allow images
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          cb(new Error('Only image files are allowed!'), false);
        } else {
          cb(null, true);
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
      },
    }),
  ],
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
