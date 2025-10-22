/**
 * Data Collection System
 * Automatically collects ML usage data for training
 */

import { TrainingDataPoint } from './types';

export class DataCollector {
  private buffer: TrainingDataPoint[] = [];
  private readonly maxBufferSize: number;
  private readonly storageKey = 'hospitality-ai-training-data';

  constructor(maxBufferSize: number = 10000) {
    this.maxBufferSize = maxBufferSize;
    this.loadBuffer();
  }

  /**
   * Collect a data point for training
   */
  async collect(dataPoint: TrainingDataPoint): Promise<void> {
    this.buffer.push(dataPoint);

    // Auto-flush when buffer is full
    if (this.buffer.length >= this.maxBufferSize) {
      await this.flush();
    }

    // Persist to storage periodically
    if (this.buffer.length % 100 === 0) {
      await this.saveBuffer();
    }
  }

  /**
   * Get count of data points for a module
   */
  getCount(module: string): number {
    return this.buffer.filter((d) => d.module === module).length;
  }

  /**
   * Get all data points for a module
   */
  getData(module: string): TrainingDataPoint[] {
    return this.buffer.filter((d) => d.module === module);
  }

  /**
   * Get all data points
   */
  getAllData(): TrainingDataPoint[] {
    return [...this.buffer];
  }

  /**
   * Flush buffer to persistent storage
   */
  async flush(): Promise<void> {
    if (typeof window === 'undefined') {
      // Server-side: Save to filesystem
      await this.saveToFile();
    } else {
      // Browser: Save to IndexedDB
      await this.saveToIndexedDB();
    }

    this.buffer = [];
  }

  /**
   * Clear all data
   */
  async clear(): Promise<void> {
    this.buffer = [];
    await this.saveBuffer();
  }

  /**
   * Export data as JSON
   */
  exportJSON(): string {
    return JSON.stringify(this.buffer, null, 2);
  }

  /**
   * Import data from JSON
   */
  importJSON(json: string): void {
    const data = JSON.parse(json);
    this.buffer = data.map((d: any) => ({
      ...d,
      timestamp: new Date(d.timestamp),
    }));
  }

  /**
   * Save buffer to localStorage (browser)
   */
  private async saveBuffer(): Promise<void> {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(this.buffer));
      } catch (error) {
        console.warn('Failed to save training data to localStorage:', error);
      }
    }
  }

  /**
   * Load buffer from localStorage (browser)
   */
  private loadBuffer(): void {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        const data = localStorage.getItem(this.storageKey);
        if (data) {
          const parsed = JSON.parse(data);
          this.buffer = parsed.map((d: any) => ({
            ...d,
            timestamp: new Date(d.timestamp),
          }));
        }
      } catch (error) {
        console.warn('Failed to load training data from localStorage:', error);
      }
    }
  }

  /**
   * Save to IndexedDB (browser, for large datasets)
   */
  private async saveToIndexedDB(): Promise<void> {
    if (typeof window === 'undefined') return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open('hospitality-ai-training', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['training-data'], 'readwrite');
        const store = transaction.objectStore('training-data');

        store.put({
          id: 'training-buffer',
          timestamp: new Date(),
          data: this.buffer,
        });

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('training-data')) {
          db.createObjectStore('training-data', { keyPath: 'id' });
        }
      };
    });
  }

  /**
   * Save to filesystem (Node.js)
   */
  private async saveToFile(): Promise<void> {
    if (typeof window !== 'undefined') return;

    try {
      const fs = await import('fs/promises');
      const path = await import('path');

      const dir = path.join(process.cwd(), 'data', 'training');
      await fs.mkdir(dir, { recursive: true });

      const filename = path.join(
        dir,
        `training-data-${new Date().toISOString().split('T')[0]}.json`
      );

      await fs.writeFile(filename, this.exportJSON());
      console.log(`Training data saved to ${filename}`);
    } catch (error) {
      console.warn('Failed to save training data to file:', error);
    }
  }

  /**
   * Get statistics about collected data
   */
  getStats(): {
    total: number;
    byModule: Record<string, number>;
    bySource: Record<string, number>;
    oldestDate: Date | null;
    newestDate: Date | null;
  } {
    const byModule: Record<string, number> = {};
    const bySource: Record<string, number> = {};
    let oldestDate: Date | null = null;
    let newestDate: Date | null = null;

    this.buffer.forEach((d) => {
      byModule[d.module] = (byModule[d.module] || 0) + 1;
      bySource[d.source] = (bySource[d.source] || 0) + 1;

      if (!oldestDate || d.timestamp < oldestDate) {
        oldestDate = d.timestamp;
      }
      if (!newestDate || d.timestamp > newestDate) {
        newestDate = d.timestamp;
      }
    });

    return {
      total: this.buffer.length,
      byModule,
      bySource,
      oldestDate,
      newestDate,
    };
  }
}

// Singleton instance
export const dataCollector = new DataCollector();
