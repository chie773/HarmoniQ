import { Message } from 'discord.js';
import { handleJoin, handleLeave } from './voice.js';
import { MusicCommands } from './music.js';
import { AudioPlayerManager } from '../audio/player.js';
import { Queue } from '../audio/queue.js';



export class CommandRouter {
    private musicCommands: MusicCommands;

    constructor(
        playerManager: AudioPlayerManager,
        queue: Queue,
        tempDir: string
    ) {
        this.musicCommands = new MusicCommands(playerManager, queue, tempDir);
    }

    async route(msg: Message): Promise<void> {
        if (msg.author.bot) return;

        const args = msg.content.trim().split(/ +/);
        const command = args.shift()?.toLowerCase();

        switch (command) {
            case '!join':
                handleJoin(msg);
                break;
            case '!leave':
                handleLeave(msg);
                break;
            case '!echo':
                this.handleEcho(msg, args);
                break;
            case 'hello':
                this.handleHello(msg);
                break;
            case '!help':
                break;
            case '!add':
            case '!play':
                await this.musicCommands.handlePlay(msg, args);
                break;
            case '!pause':
                this.musicCommands.handlePause(msg);
                break;
            case '!unpause':
                this.musicCommands.handleUnpause(msg);
                break;
            case '!loop':
                this.musicCommands.handleLoop(msg);
                break;
            case '!unloop':
                this.musicCommands.handleStopLoop(msg);
                break;
            case '!skip':
                this.musicCommands.handleSkip(msg);
                break;
            case '!q':
            case '!queue':
                this.musicCommands.handleViewQueue(msg);
                break;
            case '!duration':
                this.musicCommands.handleSongDuration(msg);
                break;
            case '!shuffle':
                this.musicCommands.handleShuffleQueue(msg);
                break;
            case '!clear':
                this.musicCommands.handleClearQueue(msg);
                break;
            case '!remove':
                this.musicCommands.handleRemoveFromQueue(msg, args);
                break;
            case '!skipTo':
                this.musicCommands.handleSkipTo(msg, args[0]);
                break;
            case '!current':
                this.musicCommands.handleCurrentSong(msg);
                break;
                
            case '!shift':
                break;

            case '!seek':
                this.musicCommands.handleSeek(msg, args);
            default:
            // ignore
        }
    }

    private handleEcho(msg: Message, args: string[]): void {
        if (!args.length) {
            msg.reply('Please provide a message to echo.');
            return;
        }
        msg.reply(args.join(' '));
    }

    private handleHello(msg: Message): void {
        msg.reply('hello');
    }
}
