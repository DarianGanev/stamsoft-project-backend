import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { randomUUID } from 'node:crypto';

@Injectable()
export class LocalImageStorageService {
  private readonly uploadDir = join(process.cwd(), 'uploads', 'listings');

  constructor(private readonly configService: ConfigService) {}

  async save(file: Express.Multer.File): Promise<string> {
    await mkdir(this.uploadDir, { recursive: true });

    const extension = this.getSafeExtension(file.originalname, file.mimetype);
    const filename = `${randomUUID()}${extension}`;

    await writeFile(join(this.uploadDir, filename), file.buffer);

    return `${this.getApiUrl()}/uploads/listings/${filename}`;
  }

  private getApiUrl(): string {
    return (
      this.configService.get<string>('API_URL') ?? 'http://localhost:3001'
    ).replace(/\/$/, '');
  }

  private getSafeExtension(originalName: string, mimetype: string): string {
    const extension = extname(originalName).toLowerCase();

    if (['.jpg', '.jpeg', '.png', '.webp'].includes(extension)) {
      return extension;
    }

    if (mimetype === 'image/png') {
      return '.png';
    }

    if (mimetype === 'image/webp') {
      return '.webp';
    }

    return '.jpg';
  }
}
