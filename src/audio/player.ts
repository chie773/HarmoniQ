import fs from 'fs';
import {Message, VoiceBasedChannel} from 'discord.js';
import {
    AudioPlayer,
    AudioPlayerStatus,
    createAudioPlayer,
    createAudioResource,
    StreamType,
    VoiceConnection,
    getVoiceConnection,
} from '@discordjs/voice';
import { CONFIG } from '../config.ts';
import { Queue } from './queue.ts';
import { client } from '../index.ts';
import  { Player } from 'moonlink.js';




export class AudioPlayerManager {
    private player: AudioPlayer;
    private queue: Queue;
    private loopActive: boolean = false;
    private currentGuildId: string | null = null;
    private currentConnection: VoiceConnection | null = null;

    constructor(queue: Queue) {
        this.queue = queue;
        this.player = createAudioPlayer();
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        this.player.on('error', (error) => {
            console.error('Audio player error:', error);
        });

        this.player.on('stateChange', (oldState, newState) => {
            if (newState.status === 'playing') {
                console.log('Song is playing');
            }
            if (newState.status === 'idle') {
                console.log('Song is over');
                this.handleSongEnd();
            }
        });
    }




    private handleSongEnd(): void {
        if (this.queue.isEmpty()) {
            console.log('Queue is now empty');
            return;
        }

        let connection = this.currentConnection;
        if (!connection && this.currentGuildId) {
            connection = getVoiceConnection(this.currentGuildId) || null;
            this.currentConnection = connection;
        }

        const currentSong = this.queue.peek();
        if (!currentSong) return;

        if (this.loopActive) {
            this.playFile(currentSong, connection || undefined);
        } else {
            this.queue.cleanupFile(currentSong);
            this.queue.shift();

            const nextSong = this.queue.peek();
            if (nextSong && connection) {
                this.playFile(nextSong, connection);
            }
        }
    }

    private playFile(filePath: string, connection?: VoiceConnection): void {
        if (!fs.existsSync(filePath)) {
            console.error(`File not found: ${filePath}`);
            return;
        }

        const resource = createAudioResource(fs.createReadStream(filePath), {
            inputType: StreamType.Arbitrary,
            inlineVolume: true,
        });

        resource.volume?.setVolume(CONFIG.DEFAULT_VOLUME);
        this.player.play(resource);

        if (connection && connection.state.status !== 'destroyed') {
            connection.subscribe(this.player);
        }
    }

    play(connection: VoiceConnection, guildId: string): boolean {
        const nextSong = this.queue.peek();
        if (!nextSong) {
            return false;
        }

        this.currentGuildId = guildId;
        this.currentConnection = connection;
        this.playFile(nextSong, connection);
        return true;
    }

    stop(): void {
        this.player.stop();
    }

    pause(): boolean {
        if (this.player.state.status === AudioPlayerStatus.Playing) {
            this.player.pause();
            return true;
        }
        return false;
    }

    unpause(): boolean {
        if (this.player.state.status === AudioPlayerStatus.Paused) {
            this.player.unpause();
            return true;
        }
        return false;
    }

    skip(): void {
        this.player.stop();
    }

    getStatus(): AudioPlayerStatus {
        return this.player.state.status;
    }

    isPlaying(): boolean {
        return this.player.state.status === AudioPlayerStatus.Playing;
    }

    isIdle(): boolean {
        return this.player.state.status === AudioPlayerStatus.Idle;
    }

    setLoop(active: boolean): void {
        this.loopActive = active;
    }

    isLooping(): boolean {
        return this.loopActive;
    }

    getPlayer(): AudioPlayer {
        return this.player;
    }
}
