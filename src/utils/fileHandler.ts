import path from 'path';
import fs from 'fs';
import fetch from 'node-fetch';
import { Attachment } from 'discord.js';
import { CONFIG } from '../config.js';

export async function downloadSongFile(
    attachment: Attachment,
    dir: string,
    fileName: string
): Promise<string | null> {
    try {
        const filePath = path.join(dir, fileName);

        const response = await fetch(attachment.url);
        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.statusText}`);
        }

        const buffer = await response.arrayBuffer();
        fs.writeFileSync(filePath, Buffer.from(buffer));

        console.log(`${fileName} has been downloaded!`);
        return filePath;
    } catch (err) {
        console.error('Error downloading file:', err);
        return null;
    }
}

export function isValidAudioFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return CONFIG.ALLOWED_AUDIO_EXTENSIONS.has(ext);
}

export function fileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
}

export function deleteFile(filePath: string): boolean {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return true;
        }
        return false;
    } catch (err) {
        console.error('Error deleting file:', err);
        return false;
    }
}
