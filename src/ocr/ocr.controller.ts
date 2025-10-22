import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  Body,
  Query,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { OcrService } from './ocr.service';
import { ProcessBase64Dto } from './dto/ocr-request.dto';
import { Express } from 'express';

@Controller('ocr')
export class OcrController {
  constructor(private readonly ocrService: OcrService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('lang') lang?: string,
  ) {
    if (!file) {
      throw new BadRequestException('กรุณาอัพโหลดไฟล์');
    }

    this.validateFile(file);

    const result = await this.ocrService.processImage(
      file.buffer,
      lang || 'tha+eng',
    );

    return {
      success: true,
      message: 'ประมวลผลสำเร็จ',
      data: {
        text: result.text,
        confidence: result.confidence,
        fileName: file.originalname,
        fileSize: file.size,
        language: lang || 'tha+eng',
      },
    };
  }

  @Post('upload-multiple')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadMultipleFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Query('lang') lang?: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('กรุณาอัพโหลดไฟล์อย่างน้อย 1 ไฟล์');
    }

    files.forEach((file) => this.validateFile(file));

    const results = await Promise.all(
      files.map(async (file) => {
        const result = await this.ocrService.processImage(
          file.buffer,
          lang || 'tha+eng',
        );
        return {
          fileName: file.originalname,
          text: result.text,
          confidence: result.confidence,
        };
      }),
    );

    return {
      success: true,
      message: `ประมวลผล ${files.length} ไฟล์สำเร็จ`,
      data: results,
    };
  }

  @Post('base64')
  async processBase64(@Body() dto: ProcessBase64Dto) {
    if (!dto.image) {
      throw new BadRequestException('กรุณาส่งข้อมูลรูปภาพ');
    }

    let buffer: Buffer;
    try {
      const base64Data = dto.image.replace(/^data:image\/\w+;base64,/, '');
      buffer = Buffer.from(base64Data, 'base64');
    } catch (error) {
      throw new BadRequestException('รูปแบบ Base64 ไม่ถูกต้อง');
    }

    const result = await this.ocrService.processImage(
      buffer,
      dto.language || 'tha+eng',
    );

    return {
      success: true,
      message: 'ประมวลผลสำเร็จ',
      data: {
        text: result.text,
        confidence: result.confidence,
        language: dto.language || 'tha+eng',
      },
    };
  }

  @Post('url')
  async processUrl(@Body('url') url: string, @Query('lang') lang?: string) {
    if (!url) {
      throw new BadRequestException('กรุณาระบุ URL ของรูปภาพ');
    }

    const result = await this.ocrService.processImageUrl(
      url,
      lang || 'tha+eng',
    );

    return {
      success: true,
      message: 'ประมวลผลสำเร็จ',
      data: {
        text: result.text,
        confidence: result.confidence,
        url,
        language: lang || 'tha+eng',
      },
    };
  }

  private validateFile(file: Express.Multer.File) {
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/webp',
      'application/pdf',
    ];

    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(
        'รองรับเฉพาะไฟล์ประเภท JPEG, PNG, WEBP และ PDF เท่านั้น',
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('ขนาดไฟล์ต้องไม่เกิน 10MB');
    }
  }
}
