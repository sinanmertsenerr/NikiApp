import {
  PipeTransform,
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import * as fs from 'fs';

// Import file-type (v16 is CommonJS compatible)
const FileType = require('file-type');

// Allowed MIME types for images
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

// Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * File Validation Pipe
 * Validates uploaded files using magic bytes (file signature)
 * This prevents MIME type spoofing attacks
 */
@Injectable()
export class FileValidationPipe implements PipeTransform {
  private readonly logger = new Logger(FileValidationPipe.name);

  async transform(file: Express.Multer.File): Promise<Express.Multer.File> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      // Delete the uploaded file
      this.deleteFile(file.path);
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      );
    }

    // Read file buffer for magic bytes validation
    let fileBuffer: Buffer;
    try {
      fileBuffer = fs.readFileSync(file.path);
    } catch (error) {
      throw new BadRequestException('Failed to read uploaded file');
    }

    // Validate magic bytes (file signature)
    const fileTypeResult = await FileType.fromBuffer(fileBuffer);

    if (!fileTypeResult) {
      this.deleteFile(file.path);
      this.logger.warn(
        `File upload rejected: Could not determine file type for ${file.originalname}`,
      );
      throw new BadRequestException(
        'Invalid file type. Could not verify file signature.',
      );
    }

    // Check if the actual file type matches allowed types
    if (!ALLOWED_MIME_TYPES.includes(fileTypeResult.mime)) {
      this.deleteFile(file.path);
      this.logger.warn(
        `File upload rejected: Invalid MIME type ${fileTypeResult.mime} for ${file.originalname}`,
      );
      throw new BadRequestException(
        `Invalid file type: ${fileTypeResult.mime}. Only images (JPEG, PNG, GIF, WebP) are allowed.`,
      );
    }

    // Check for MIME type mismatch (potential spoofing attempt)
    if (file.mimetype !== fileTypeResult.mime) {
      this.logger.warn(
        `MIME type mismatch detected! Declared: ${file.mimetype}, Actual: ${fileTypeResult.mime}, File: ${file.originalname}`,
      );
      // We allow this if the actual type is valid, but log it for monitoring
    }

    // Additional security: Check file extension matches actual type
    const actualExtension = fileTypeResult.ext;
    const declaredExtension = file.originalname.split('.').pop()?.toLowerCase();

    if (declaredExtension !== actualExtension) {
      this.logger.warn(
        `Extension mismatch: Declared .${declaredExtension}, Actual .${actualExtension}, File: ${file.originalname}`,
      );
      // Not blocking, but logged for security monitoring
    }

    this.logger.log(
      `File validated successfully: ${file.originalname} (${fileTypeResult.mime})`,
    );

    return file;
  }

  /**
   * Delete file from disk (cleanup on validation failure)
   */
  private deleteFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        this.logger.log(`Deleted invalid file: ${filePath}`);
      }
    } catch (error) {
      this.logger.error(`Failed to delete file: ${filePath}`, error);
    }
  }
}

/**
 * Lightweight validation for cases where full magic bytes check isn't needed
 * Just validates extension and basic MIME type
 */
@Injectable()
export class BasicFileValidationPipe implements PipeTransform {
  transform(file: Express.Multer.File): Express.Multer.File {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const extension = file.originalname.split('.').pop()?.toLowerCase();

    if (!extension || !allowedExtensions.includes(extension)) {
      throw new BadRequestException(
        `Invalid file extension. Allowed: ${allowedExtensions.join(', ')}`,
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      );
    }

    return file;
  }
}
