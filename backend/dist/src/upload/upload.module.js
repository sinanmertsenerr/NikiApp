"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadModule = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const uuid_1 = require("uuid");
const upload_controller_1 = require("./upload.controller");
const upload_service_1 = require("./upload.service");
const prisma_module_1 = require("../prisma/prisma.module");
let UploadModule = class UploadModule {
};
exports.UploadModule = UploadModule;
exports.UploadModule = UploadModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            platform_express_1.MulterModule.register({
                storage: (0, multer_1.diskStorage)({
                    destination: (req, file, cb) => {
                        const uploadPath = (0, path_1.join)(process.cwd(), 'uploads');
                        if (file.fieldname === 'avatar') {
                            cb(null, (0, path_1.join)(uploadPath, 'avatars'));
                        }
                        else if (file.fieldname === 'productImage') {
                            cb(null, (0, path_1.join)(uploadPath, 'products'));
                        }
                        else {
                            cb(null, uploadPath);
                        }
                    },
                    filename: (req, file, cb) => {
                        const uniqueName = `${(0, uuid_1.v4)()}${(0, path_1.extname)(file.originalname)}`;
                        cb(null, uniqueName);
                    },
                }),
                fileFilter: (req, file, cb) => {
                    if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
                        cb(new Error('Only image files are allowed!'), false);
                    }
                    else {
                        cb(null, true);
                    }
                },
                limits: {
                    fileSize: 5 * 1024 * 1024,
                },
            }),
        ],
        controllers: [upload_controller_1.UploadController],
        providers: [upload_service_1.UploadService],
        exports: [upload_service_1.UploadService],
    })
], UploadModule);
//# sourceMappingURL=upload.module.js.map