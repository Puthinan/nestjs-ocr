import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { createWorker, Worker } from 'tesseract.js';

export interface OcrResult {
  text: string;
  confidence: number;
  words?: Array<{
    text: string;
    confidence: number;
  }>;
}

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);
  private workers: Map<string, Worker> = new Map();

  async processImage(
    imageBuffer: Buffer,
    language: string = 'tha+eng',
  ): Promise<OcrResult> {
    const startTime = Date.now();

    try {
      const worker = await this.getOrCreateWorker(language);

      this.logger.log(`กำลังประมวลผลภาพด้วยภาษา: ${language}`);

      const { data } = await worker.recognize(imageBuffer);

      const processingTime = Date.now() - startTime;
      this.logger.log(`ประมวลผลสำเร็จใน ${processingTime}ms`);

      return {
        text: data.text.trim(),
        confidence: Math.round(data.confidence * 100) / 100,
        words:
          data.blocks?.flatMap(
            (block) =>
              block.paragraphs?.flatMap(
                (para) =>
                  para.lines?.flatMap(
                    (line) =>
                      line.words?.map((word) => ({
                        text: word.text,
                        confidence: Math.round(word.confidence * 100) / 100,
                      })) ?? [],
                  ) ?? [],
              ) ?? [],
          ) ?? [],
      };
    } catch (error) {
      this.logger.error('เกิดข้อผิดพลาดในการประมวลผล OCR:', error);
      throw new InternalServerErrorException('ไม่สามารถประมวลผลรูปภาพได้');
    }
  }

  async processImageUrl(
    imageUrl: string,
    language: string = 'tha+eng',
  ): Promise<OcrResult> {
    try {
      const worker = await this.getOrCreateWorker(language);

      this.logger.log(`กำลังประมวลผลจาก URL: ${imageUrl}`);

      const { data } = await worker.recognize(imageUrl);

      return {
        text: data.text.trim(),
        confidence: Math.round(data.confidence * 100) / 100,
        words:
          data.blocks?.flatMap(
            (block) =>
              block.paragraphs?.flatMap(
                (para) =>
                  para.lines?.flatMap(
                    (line) =>
                      line.words?.map((word) => ({
                        text: word.text,
                        confidence: Math.round(word.confidence * 100) / 100,
                      })) ?? [],
                  ) ?? [],
              ) ?? [],
          ) ?? [],
      };
    } catch (error) {
      this.logger.error('เกิดข้อผิดพลาดในการประมวลผล URL:', error);
      throw new InternalServerErrorException(
        'ไม่สามารถประมวลผลรูปภาพจาก URL ได้',
      );
    }
  }

  private async getOrCreateWorker(language: string): Promise<Worker> {
    const langKey = language.replace(/\s+/g, '+'); // เปลี่ยน 'tha eng' → 'tha+eng'
    console.log(langKey)
    if (this.workers.has(langKey)) {
      return this.workers.get(langKey);
    }

    this.logger.log(`กำลังสร้าง Worker สำหรับภาษา: ${langKey}`);

    const worker = await createWorker(langKey, undefined, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          this.logger.debug(`Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
      langPath: 'https://tessdata.projectnaptha.com/4.0.0_best',
    });
    this.workers.set(langKey, worker);
    return worker;
  }

  async onModuleDestroy() {
    this.logger.log('กำลังปิด Workers...');

    for (const [lang, worker] of this.workers.entries()) {
      await worker.terminate();
      this.logger.log(`ปิด Worker ของภาษา ${lang} สำเร็จ`);
    }

    this.workers.clear();
  }
}
