import fs from 'fs';
import path from 'path';
import { CONFIG } from '../config.js';
import { isValidAudioFile } from '../utils/fileHandler.js';

export class Queue {
    private items: string[] = [];
    private downloadedFiles = new Set<string>();

    add(filePath: string, isDownloaded: boolean = false): boolean {
        if (this.items.length >= CONFIG.MAX_QUEUE_SIZE) {
            return false;
        }

        this.items.push(filePath);
        if (isDownloaded) {
            this.downloadedFiles.add(filePath);
        }
        return true;
    }

    peek(): string | null {
        return this.items.length > 0 ? this.items[0] : null;
    }

    shift(): string | null {
        const item = this.items.shift();
        if (item && this.downloadedFiles.has(item)) {
            this.downloadedFiles.delete(item);
        }
        return item || null;
    }

    get length(): number {
        return this.items.length;
    }

    isEmpty(): boolean {
        return this.items.length === 0;
    }

    isFull(): boolean {
        return this.items.length >= CONFIG.MAX_QUEUE_SIZE;
    }

    clear(): void {
        for (const filePath of this.downloadedFiles) {
            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                } catch (err) {
                    console.error('Error cleaning up file:', err);
                }
            }
        }
        this.downloadedFiles.clear();
        this.items = [];
    }

    cleanupFile(filePath: string): void {
        if (this.downloadedFiles.has(filePath) && fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
                this.downloadedFiles.delete(filePath);
            } catch (err) {
                console.error('Error deleting file:', err);
            }
        }
    }

    loadFromDirectory(dir: string): void {
        try {
            const files = fs.readdirSync(dir);
            for (const name of files) {
                const fullPath = path.join(dir, name);
                let stat;
                try {
                    stat = fs.statSync(fullPath);
                } catch {
                    continue;
                }
                if (!stat.isFile()) continue;

                if (isValidAudioFile(fullPath) && !this.items.includes(fullPath)) {
                    this.items.push(fullPath);
                }
            }
            console.log(`Added ${this.items.length} files from temp folder`);
        } catch (err) {
            console.error('Failed to read temp folder:', err);
        }
    }
}
