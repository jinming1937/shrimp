import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { diskStorage } from 'multer';
import path, { extname } from 'path';
import * as fs from 'fs';

@Injectable()
export class FileUploadService {
  // 确保上传目录存在
  private ensureUploadDir() {
    const uploadDir = path.resolve(__dirname, '../../../../.chat/imgs');
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    return uploadDir;
  }

  // 确保上传目录存在（可用于静态和实例方法）
  private static ensureUploadDir() {
    const uploadDir = path.resolve(__dirname, '../../../../.chat/imgs');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    return uploadDir;
  }

  // 配置 multer 存储选项（静态方法，供 @UseInterceptors 装饰器在类初始化阶段使用）
  static getMulterOptions() {
    return {
      // 存储配置
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadDir = FileUploadService.ensureUploadDir();
          cb(null, uploadDir);
        },
        // 自定义文件名（避免重名）
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
          cb(null, filename);
        },
      }),
      // 文件大小限制（这里限制 5MB）
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      // 文件类型过滤（仅允许图片、文档）
      fileFilter: (req, file, cb) => {
        // 允许的 MIME 类型
        const allowedMimeTypes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];

        if (allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new HttpException(
              `不支持的文件类型: ${file.mimetype}，仅允许: ${allowedMimeTypes.join(', ')}`,
              HttpStatus.BAD_REQUEST,
            ),
            false,
          );
        }
      },
    };
  }

  getMulterOptions() {
    return FileUploadService.getMulterOptions();
  }

  // 获取文件访问路径（可选，用于返回给前端）
  getFileUrl(filename: string): string {
    // 替换为你的实际域名/端口
    return `http://localhost:5173/api/img/${filename}`;
  }
}
