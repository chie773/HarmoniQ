import { Attachment, Message } from 'discord.js';
import { AudioPlayerStatus, VoiceConnection } from '@discordjs/voice';
import { AudioPlayerManager } from '../audio/player.ts';
import { Queue } from '../audio/queue.ts';
import { validateAndGetConnection } from '../utils/voiceChannel.ts';
import { downloadSongFile, isValidAudioFile, fileExists } from '../utils/fileHandler.ts';
import path from 'path';
import fs from 'fs';
import fetch from 'node-fetch';

export class MusicCommands {
    constructor(
        private playerManager: AudioPlayerManager,
        private queue: Queue,
        private tempDir: string
    ) {}

    private getSongName(filePath: string): string {
        return path.basename(filePath);
    }

    async handlePlay(msg: Message, args: string[]): Promise<void> {
        const result = validateAndGetConnection(msg);
        if (!result) return;

        const { voiceChannel, connection } = result;

        if (connection.state.status !== 'destroyed') {
            connection.subscribe(this.playerManager.getPlayer());
        }

        const attachment = msg.attachments.first();

        if (attachment) {
            await this.handleAttachment(msg, attachment, connection);
        } else if (args.length > 0) {
            await this.handleFileInput(msg, args[0], connection);
        } else {
            await this.handleQueuePlay(msg, connection);
        }
    }

    private async handleAttachment(
        msg: Message,
        attachment: Attachment,
        connection: VoiceConnection
    ): Promise<void> {
        if (!isValidAudioFile(attachment.name)) {
            msg.reply('Please attach a valid audio file (mp3, wav, ogg, m4a, aac)!');
            return;
        }

        const filePath = await downloadSongFile(attachment, this.tempDir, attachment.name);
        if (!filePath) {
            msg.reply('Failed to download the file.');
            return;
        }

        if (this.queue.isFull()) {
            msg.reply('Playlist is full! Please wait for current songs to finish before adding more.');
            return;
        }

        this.queue.add(filePath, true);
        const songName = this.getSongName(filePath);

        if (this.playerManager.isIdle()) {
            this.playerManager.play(connection, msg.guild!.id);
            msg.reply(`~Playing Now: **${songName}**~`);
        } else {
            msg.reply(`**${songName}** has been added to the queue!`);
        }
    }

    private async handleFileInput(
        msg: Message,
        input: string,
        connection: VoiceConnection
    ): Promise<void> {
        if (input.startsWith('http://') || input.startsWith('https://')) {
            await this.handleUrlInput(msg, input, connection);
            return;
        }

        const filePath = path.resolve(input);
        if (!fileExists(filePath)) {
            msg.reply('File not found! Please provide a valid file path or URL.');
            return;
        }

        if (!isValidAudioFile(filePath)) {
            msg.reply('Please provide a valid audio file (mp3, wav, ogg, m4a, aac)!');
            return;
        }

        if (this.queue.isFull()) {
            msg.reply('Playlist is full! Please wait for current songs to finish before adding more.');
            return;
        }

        this.queue.add(filePath, false);
        const songName = this.getSongName(filePath);

        if (this.playerManager.isIdle()) {
            this.playerManager.play(connection, msg.guild!.id);
            msg.reply(`~Playing Now: **${songName}**~`);
        } else {
            msg.reply(`**${songName}** has been added to the queue!`);
        }
    }

    private async handleUrlInput(
        msg: Message,
        url: string,
        connection: VoiceConnection
    ): Promise<void> {
        const urlPath = new URL(url).pathname;
        const fileName = path.basename(urlPath) || `audio_${Date.now()}.mp3`;

        if (!isValidAudioFile(fileName)) {
            const defaultFileName = fileName.includes('.') ? fileName : `${fileName}.mp3`;
            const filePath = await this.downloadFromUrl(url, defaultFileName);
            if (!filePath) {
                msg.reply('Failed to download the file from URL.');
                return;
            }
            await this.addToQueueAndPlay(msg, filePath, connection, true);
        } else {
            const filePath = await this.downloadFromUrl(url, fileName);
            if (!filePath) {
                msg.reply('Failed to download the file from URL.');
                return;
            }
            await this.addToQueueAndPlay(msg, filePath, connection, true);
        }
    }

    private async downloadFromUrl(url: string, fileName: string): Promise<string | null> {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch: ${response.statusText}`);
            }

            const buffer = await response.arrayBuffer();
            const filePath = path.join(this.tempDir, fileName);
            fs.writeFileSync(filePath, Buffer.from(buffer));

            console.log(`Downloaded file from URL: ${fileName}`);
            return filePath;
        } catch (err) {
            console.error('Error downloading from URL:', err);
            return null;
        }
    }

    private async addToQueueAndPlay(
        msg: Message,
        filePath: string,
        connection: VoiceConnection,
        isDownloaded: boolean
    ): Promise<void> {
        if (this.queue.isFull()) {
            msg.reply('Playlist is full! Please wait for current songs to finish before adding more.');
            return;
        }

        this.queue.add(filePath, isDownloaded);
        const songName = this.getSongName(filePath);

        if (this.playerManager.isIdle()) {
            this.playerManager.play(connection, msg.guild!.id);
            msg.reply(`~Playing Now: **${songName}**~`);
        } else {
            msg.reply(`**${songName}** has been added to the queue!`);
        }
    }

    private async handleQueuePlay(msg: Message, connection: VoiceConnection): Promise<void> {
        if (this.queue.isEmpty()) {
            msg.reply('Please attach an audio file to play or provide a file path/URL!');
            return;
        }

        if (this.playerManager.isIdle()) {
            this.playerManager.play(connection, msg.guild!.id);
            msg.reply('~Playing from queue~');
        } else {
            msg.reply('Song is already playing! Use !skip to skip the current song.');
        }
    }

    handlePause(msg: Message): void {
        const result = validateAndGetConnection(msg);
        if (!result) return;

        if (this.playerManager.pause()) {
            msg.reply('Player was successfully paused');
        } else {
            msg.reply('Nothing is playing to pause');
        }
    }

    handleUnpause(msg: Message): void {
        const result = validateAndGetConnection(msg);
        if (!result) return;

        if (this.playerManager.unpause()) {
            msg.reply('Song has been unpaused');
        } else {
            msg.reply('Nothing is paused');
        }
    }

    handleSkip(msg: Message): void {
        const result = validateAndGetConnection(msg);
        if (!result) return;

        if (
            this.playerManager.getStatus() === AudioPlayerStatus.Playing ||
            this.playerManager.getStatus() === AudioPlayerStatus.Paused ||
            this.playerManager.getStatus() === AudioPlayerStatus.AutoPaused
        ) {
            this.playerManager.skip();
            msg.reply('Song skipped!');
        } else {
            msg.reply('Nothing is playing');
        }
    }

    handleLoop(msg: Message): void {
        const result = validateAndGetConnection(msg);
        if (!result) return;

        const status = this.playerManager.getStatus();
        if (
            status === AudioPlayerStatus.Playing ||
            status === AudioPlayerStatus.Paused ||
            status === AudioPlayerStatus.AutoPaused
        ) {
            this.playerManager.setLoop(true);
            msg.reply('Song is now looping!');
        } else {
            msg.reply('Nothing is playing...');
        }
    }

    handleStopLoop(msg: Message): void {
        const result = validateAndGetConnection(msg);
        if (!result) return;

        const status = this.playerManager.getStatus();
        if (
            status === AudioPlayerStatus.Playing ||
            status === AudioPlayerStatus.Paused ||
            status === AudioPlayerStatus.AutoPaused
        ) {
            this.playerManager.setLoop(false);
            msg.reply('Song has stopped looping!');
        } else {
            msg.reply('Nothing is playing...');
        }
    }
}
