import { UploadService } from './upload.service';
export declare class UploadController {
    private uploadService;
    constructor(uploadService: UploadService);
    uploadAvatar(req: any, file: Express.Multer.File): Promise<{
        success: boolean;
        message: string;
        avatarUrl: string;
    }>;
    uploadProductImage(productId: string, file: Express.Multer.File): Promise<{
        success: boolean;
        message: string;
        imageUrl: string;
    }>;
}
