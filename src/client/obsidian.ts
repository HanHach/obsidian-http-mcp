import axios, { type AxiosInstance } from 'axios';
import type { ObsidianFile } from '../types/index.js';

export class ObsidianClient {
  private client: AxiosInstance;

  constructor(baseUrl: string, apiKey: string) {
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
  }

  private validatePath(path: string): void {
    if (path.includes('..')) {
      throw new Error('Invalid path: traversal not allowed');
    }
  }

  private encodePath(path: string): string {
    // Encode each path segment separately to preserve '/' separators
    // Handles emojis, spaces, special chars (e.g., "🧪Test.md" → "%F0%9F%A7%AATest.md")
    return path.split('/').map(segment =>
      segment ? encodeURIComponent(segment) : ''
    ).join('/');
  }

  async listVault(path: string = ''): Promise<{ files: string[]; folders: string[] }> {
    this.validatePath(path);
    const encoded = this.encodePath(path);
    const response = await this.client.get(`/vault/${encoded}`);
    return response.data;
  }

  async readFile(path: string): Promise<string> {
    this.validatePath(path);
    const encoded = this.encodePath(path);
    const response = await this.client.get(`/vault/${encoded}`);
    return response.data;
  }

  async writeFile(path: string, content: string): Promise<void> {
    this.validatePath(path);
    const encoded = this.encodePath(path);
    await this.client.put(`/vault/${encoded}`, content, {
      headers: { 'Content-Type': 'text/markdown' },
    });
  }

  async appendFile(path: string, content: string): Promise<void> {
    this.validatePath(path);
    const encoded = this.encodePath(path);
    await this.client.patch(`/vault/${encoded}`, content, {
      headers: { 'Content-Type': 'text/markdown' },
    });
  }

  async deleteFile(path: string): Promise<void> {
    this.validatePath(path);
    const encoded = this.encodePath(path);
    await this.client.delete(`/vault/${encoded}`);
  }

  async fileExists(path: string): Promise<boolean> {
    this.validatePath(path);
    const encoded = this.encodePath(path);
    try {
      await this.client.get(`/vault/${encoded}`);
      return true;
    } catch {
      return false;
    }
  }
}
