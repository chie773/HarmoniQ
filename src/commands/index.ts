import { Message } from 'discord.js';
import { handleJoin, handleLeave } from './voice.js';
import { MusicCommands } from './music.js';
import { AudioPlayerManager } from '../audio/player.js';
import { Queue } from '../audio/queue.js';
import { AudioMixCommands } from './audiomix.js';



export class CommandRouter {
    private musicCommands: MusicCommands;
    private audioMixOn: any;
    private audioMixCommands: any;

    constructor(
        playerManager: AudioPlayerManager,
        queue: Queue,
        tempDir: string
    ) {
        this.musicCommands = new MusicCommands(playerManager, queue, tempDir);
    }

    private ensureAudioMixCommands(msg: Message): boolean {
        const player = this.musicCommands.getMoonlinkPlayer();
        if (!player) {
            msg.reply('No active player! Play a song first.');
            return false;
        }
        if (!this.audioMixCommands) {
            this.audioMixCommands = new AudioMixCommands(player);
        }
        return true;
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
            
            case '?help':
            case '!help':
                const helpMessage = `
                    **Available Commands**

                    🎧 **Voice**
                    • \`!join\` — Makes the bot join your current voice channel (Use play instead, bot auto joins)
                    • \`!leave\` — Disconnects the bot from the voice channel

                    💬 **Utility**
                    • \`!echo <message>\` — Repeats the provided message
                    • \`hello\` — Sends a greeting from the bot

                    🎵 **Music**
                    • \`!play / !add <mp3 file || url || playlist>\` — Plays a song, URL, or YouTube playlist (max 50 songs)
                    • \`!stop\` — Stops playback of current song
                    • \`!pause\` — Pauses the current song
                    • \`!resume\` — Resumes the paused song
                    • \`!skip\` — Skips the current song
                    • \`!loop\` — Loops the current song
                    • \`!unloop\` — Disables looping
                    • \`!queue / !q [start]\` — Displays the queue (optionally from a starting index)
                    • \`!current\` — Shows the currently playing song
                    • \`!duration\` — Shows the duration of the current song
                    • \`!shuffle\` — Shuffles the queue
                    • \`!remove <index>\` — Removes a song from the queue
                    • \`!clear\` — Clears the entire queue
                    • \`!skipTo <index>\` — Skips to a specific song in the queue
                    • \`!seek <seconds>\` — Seeks forward/backward in the current song

                    🎚️ **Audio Mix & Effects**
                    • \`!volume <0-100>\` — Sets the volume level
                    • \`!rock\` — Applies Rock EQ preset
                    • \`!bassboost\` — Applies Bass Boost EQ preset
                    • \`!pop\` — Applies Pop EQ preset
                    • \`!jazz\` — Applies Jazz EQ preset
                    • \`!deep\` — Applies Deep EQ preset
                    • \`!flat\` — Applies Flat EQ preset
                    • \`!hiphop\` — Applies Hip-Hop EQ preset
                    • \`!classical\` — Applies Classical EQ preset
                    • \`!spokenword\` — Applies Spoken Word EQ preset
                    • \`!2x\` — Sets playback speed to 2x
                    • \`!0.5x / !.5x\` — Sets playback speed to 0.5x
                    • \`!8d\` — Applies 8D audio effect
                    • \`!clearfilters\` — Removes all audio filters

                    `;

                msg.reply(helpMessage);
                break;

            case '!add':
            case '!play':
                await this.musicCommands.handlePlay(msg, args);
                this.audioMixCommands = new AudioMixCommands(this.musicCommands.getMoonlinkPlayer());
                break;

            case '!pause':
                this.musicCommands.handlePause(msg);
                break;

            case '!resume':
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
                this.musicCommands.handleViewQueue(msg, args);
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
                break;

            case '!volume':
                if (!this.ensureAudioMixCommands(msg)) break;
                const volume = parseInt(args[0], 10);
                this.audioMixCommands.setVolume(msg, volume);
                break;

            case '!rock':
                if (!this.ensureAudioMixCommands(msg)) break;
                this.audioMixCommands.setRock(msg);
                break;

            case '!bassboost':
                if (!this.ensureAudioMixCommands(msg)) break;
                this.audioMixCommands.setBassBoost(msg);
                break;

            case '!pop':
                if (!this.ensureAudioMixCommands(msg)) break;
                this.audioMixCommands.setPop(msg);
                break;

            case '!jazz':
                if (!this.ensureAudioMixCommands(msg)) break;
                this.audioMixCommands.setJazz(msg);
                break;

            case '!deep':
                if (!this.ensureAudioMixCommands(msg)) break;
                this.audioMixCommands.setDeep(msg);
                break;

            case '!flat':
                if (!this.ensureAudioMixCommands(msg)) break;
                this.audioMixCommands.setFlat(msg);
                break;

            case '!hiphop':
                if (!this.ensureAudioMixCommands(msg)) break;
                this.audioMixCommands.setHipHop(msg);
                break;

            case '!classical':
                if (!this.ensureAudioMixCommands(msg)) break;
                this.audioMixCommands.setClassical(msg);
                break;

            case '!spokenword':
                if (!this.ensureAudioMixCommands(msg)) break;
                this.audioMixCommands.setSpokenWord(msg);
                break;

            case '!2x':
                if (!this.ensureAudioMixCommands(msg)) break;
                this.audioMixCommands.setSpeed2x(msg);
                break;

            case '!0.5x':
            case '!.5x':
                if (!this.ensureAudioMixCommands(msg)) break;
                this.audioMixCommands.setSpeedHalf(msg);
                break;

            case '!8d':
                if (!this.ensureAudioMixCommands(msg)) break;
                this.audioMixCommands.set8DAudio(msg);
                break;

            case '!clearfilters':
                if (!this.ensureAudioMixCommands(msg)) break;
                this.audioMixCommands.clearFilters(msg);
                break;    

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
