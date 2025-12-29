import {
  Controller,
  Post,
  Put,
  Param,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UploadService } from './upload.service';
import { FileValidationPipe } from '../common/pipes/file-validation.pipe';

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  constructor(private uploadService: UploadService) {}

  // Upload user avatar
  @Post('avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload user avatar' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(
    @Request() req,
    @UploadedFile(FileValidationPipe) file: Express.Multer.File,
  ) {
    const avatarUrl = await this.uploadService.updateUserAvatar(req.user.id, file.filename);

    return {
      success: true,
      message: 'Avatar uploaded successfully',
      avatarUrl,
    };
  }

  // Upload product image (Admin only)
  @Put('product/:productId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload product image (Admin only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        productImage: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('productImage'))
  async uploadProductImage(
    @Param('productId') productId: string,
    @UploadedFile(FileValidationPipe) file: Express.Multer.File,
  ) {
    const imageUrl = await this.uploadService.updateProductImage(productId, file.filename);

    return {
      success: true,
      message: 'Product image uploaded successfully',
      imageUrl,
    };
  }
}
