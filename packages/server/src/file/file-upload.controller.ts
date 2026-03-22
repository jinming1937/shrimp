import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  HttpStatus,
  Res,
  Get,
  Param,
  HttpException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { FileUploadService } from './file-upload.service';
import type { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

const UPLOAD_DIR = path.resolve(__dirname, '../../../../.chat/imgs');

const MimeType: Record<string, string> = {
  png: 'image/png',
  gif: 'image/gif',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
};

@Controller('/api/')
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  // 单文件上传接口
  @Post('upload/single')
  @UseInterceptors(FileInterceptor('file', FileUploadService.getMulterOptions()))
  async uploadSingleFile(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Res() res: Response,
  ) {
    if (!file) {
      throw new HttpException('未找到上传的文件', HttpStatus.BAD_REQUEST);
    }

    return res.status(HttpStatus.OK).json({
      code: 200,
      message: '文件上传成功',
      data: {
        originalName: file.originalname,
        filename: file.filename,
        size: file.size,
        mimetype: file.mimetype,
        path: file.path,
        url: this.fileUploadService.getFileUrl(file.filename),
      },
    });
  }

  // 多文件上传接口（最多5个）
  @Post('upload/multiple')
  @UseInterceptors(FilesInterceptor('files', 5, FileUploadService.getMulterOptions()))
  async uploadMultipleFiles(
    @UploadedFiles() files: Express.Multer.File[] | undefined,
    @Res() res: Response,
  ) {
    const safeFiles = files ?? [];

    if (safeFiles.length === 0) {
      throw new HttpException('未找到上传的文件', HttpStatus.BAD_REQUEST);
    }

    const fileList = safeFiles.map((file) => ({
      originalName: file.originalname,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
      path: file.path,
      url: this.fileUploadService.getFileUrl(file.filename),
    }));

    return res.status(HttpStatus.OK).json({
      code: 200,
      message: `成功上传 ${safeFiles.length} 个文件`,
      data: fileList,
    });
  }

  @Get('img/:img')
  async getImg(@Param('img') img: string, @Res() res: Response) {
    const safeName = path.basename(img);
    const filePath = path.join(UPLOAD_DIR, safeName);
    console.log('okkkk', img);
    if (!filePath.startsWith(UPLOAD_DIR)) {
      throw new HttpException('非法访问路径', HttpStatus.BAD_REQUEST);
    }

    if (!fs.existsSync(filePath)) {
      throw new HttpException('图片不存在', HttpStatus.NOT_FOUND);
    }

    const ext = path.extname(safeName).slice(1).toLowerCase();
    const contentType = MimeType[ext] ?? 'application/octet-stream';
    console.log('okkkk', contentType);
    res.setHeader('Content-Type', contentType);

    return res.sendFile(safeName, { root: UPLOAD_DIR });
  }
}

