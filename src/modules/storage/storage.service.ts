import { promises as fs } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { Injectable } from '@nestjs/common';

@Injectable()
export class StorageService {
  private readonly baseDir = resolve(process.cwd(), 'data');
  private readonly rawPath = resolve(this.baseDir, 'webhooks.jsonl');
  private readonly eventsPath = resolve(this.baseDir, 'events.jsonl');

  async appendRaw(payload: unknown, metadata: Record<string, unknown>): Promise<void> {
    await this.appendLine(this.rawPath, {
      receivedAt: new Date().toISOString(),
      metadata,
      payload,
    });
  }

  async appendEvent(event: unknown): Promise<void> {
    await this.appendLine(this.eventsPath, event);
  }

  private async appendLine(filePath: string, data: unknown): Promise<void> {
    await this.ensureDir();
    const line = `${JSON.stringify(data)}\n`;
    await fs.appendFile(filePath, line, 'utf8');
  }

  private async ensureDir(): Promise<void> {
    await fs.mkdir(dirname(this.rawPath), { recursive: true });
  }
}
