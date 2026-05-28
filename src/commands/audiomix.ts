// src/commands/music/AudioMixCommands.ts
import { Message } from 'discord.js';
import { Player } from 'moonlink.js';
import { validateAndGetConnection } from '../utils/voiceChannel.js';
import { EQPresets } from './EQPresets.js';

export class AudioMixCommands {
    private player: Player; // Moonlink / Lavalink player

    constructor(player: Player) {
        this.player = player;
    }

    async setVolume(msg: Message, args: string) {
        const result = validateAndGetConnection(msg);
        if (!result) return;
        
        const { voiceChannel, connection } = result;
        
        if (!connection) {
            msg.reply(`I'm not in a voice channel!`);
            return;
        }
        
        if (Number.isNaN(args)) {
            msg.reply("This is not a valid number!");
            return;
        }

        const volume = parseInt(args, 10);

        if (!this.player?.playing) {
            return msg.reply('Nothing is playing.');
        }

        if (volume < 0 || volume > 100) {
            return msg.reply('Volume must be between 0 and 100.');
        }

        this.player.setVolume(volume);
        msg.reply(`🔊 Volume set to **${volume}%**`);
    }

    async setRock(msg: Message) {
        const result = validateAndGetConnection(msg);
        if (!result) return;

        const { connection } = result;
        if (!connection) {
            msg.reply(`I'm not in a voice channel!`);
            return;
        }

        this.player.filters.setEqualizer(EQPresets.Rock);
        await this.player.filters.apply();

        msg.reply(`🎸 Rock preset applied!`);
    }

    async setBassBoost(msg: Message) {
        const result = validateAndGetConnection(msg);
        if (!result) return;

        const { connection } = result;
        if (!connection) {
            msg.reply(`I'm not in a voice channel!`);
            return;
        }

        this.player.filters.setEqualizer(EQPresets.BassBoost);
        await this.player.filters.apply();

        msg.reply(`🎚️ Bass Boost preset applied!`);
    }

    async setPop(msg: Message) {
        const result = validateAndGetConnection(msg);
        if (!result) return;

        const { connection } = result;
        if (!connection) return msg.reply(`I'm not in a voice channel!`);

        this.player.filters.setEqualizer(EQPresets.Pop);
        await this.player.filters.apply();

        msg.reply(`🎤 Pop preset applied!`);
    }

    async setJazz(msg: Message) {
        const result = validateAndGetConnection(msg);
        if (!result) return;

        const { connection } = result;
        if (!connection) return msg.reply(`I'm not in a voice channel!`);

        this.player.filters.setEqualizer(EQPresets.Jazz);
        await this.player.filters.apply();

        msg.reply(`🎷 Jazz preset applied!`);
    }

    async setDeep(msg: Message) {
        const result = validateAndGetConnection(msg);
        if (!result) return;

        const { connection } = result;
        if (!connection) return msg.reply(`I'm not in a voice channel!`);

        this.player.filters.setEqualizer(EQPresets.Deep);
        await this.player.filters.apply();

        msg.reply(`🔊 Deep preset applied!`);
    }

    async setFlat(msg: Message) {
        const result = validateAndGetConnection(msg);
        if (!result) return;

        const { connection } = result;
        if (!connection) return msg.reply(`I'm not in a voice channel!`);

        this.player.filters.setEqualizer(EQPresets.Flat);
        await this.player.filters.apply();

        msg.reply(`⚪ Flat preset applied!`);
    }

    async setHipHop(msg: Message) {
        const result = validateAndGetConnection(msg);
        if (!result) return;

        const { connection } = result;
        if (!connection) return msg.reply(`I'm not in a voice channel!`);

        this.player.filters.setEqualizer(EQPresets.HipHop);
        await this.player.filters.apply();

        msg.reply(`🎧 Hip-Hop preset applied!`);
    }

    async setClassical(msg: Message) {
        const result = validateAndGetConnection(msg);
        if (!result) return;

        const { connection } = result;
        if (!connection) return msg.reply(`I'm not in a voice channel!`);

        this.player.filters.setEqualizer(EQPresets.Classical);
        await this.player.filters.apply();

        msg.reply(`🎼 Classical preset applied!`);
    }

    async setSpokenWord(msg: Message) {
        const result = validateAndGetConnection(msg);
        if (!result) return;

        const { connection } = result;
        if (!connection) return msg.reply(`I'm not in a voice channel!`);

        this.player.filters.setEqualizer(EQPresets.SpokenWord);
        await this.player.filters.apply();

        msg.reply(`🗣️ Spoken Word preset applied!`);
    }

    async setSpeed2x(msg: Message) {
        const result = validateAndGetConnection(msg);
        if (!result) return;

        const { connection } = result;
        if (!connection) return msg.reply(`I'm not in a voice channel!`);

        this.player.filters.setTimescale({
            speed: 2.0,
            pitch: 2.0,
            rate: 1.0
        });

        await this.player.filters.apply();

        msg.reply(`⏩ Playback speed set to 2x!`);
    }

    async setSpeedHalf(msg: Message) {
        const result = validateAndGetConnection(msg);
        if (!result) return;

        const { connection } = result;
        if (!connection) return msg.reply(`I'm not in a voice channel!`);

        this.player.filters.setTimescale({
            speed: 0.5,
            pitch: 0.5,
            rate: 1.0
        });

        await this.player.filters.apply();

        msg.reply(`🐢 Playback speed set to 0.5x!`);
    }

    async set8DAudio(msg: Message) {
        const result = validateAndGetConnection(msg);
        if (!result) return;

        const { connection } = result;
        if (!connection) return msg.reply(`I'm not in a voice channel!`);

        this.player.filters.setRotation({
            rotationHz: 0.1
        });

        await this.player.filters.apply();

        msg.reply(`🎧 8D Audio effect applied!`);
    }

    async setSlowedReverb(msg: Message) {
        const result = validateAndGetConnection(msg);
        if (!result) return;

        const { connection } = result;
        if (!connection) return msg.reply(`I'm not in a voice channel!`);

        this.player.filters.setTimescale({
            speed: 0.87,
            pitch: 0.87,
            rate: 1.0
        });

        await this.player.filters.apply();

        msg.reply(`🐌 Slowed + Reverb effect applied!`);
    }

    async clearFilters(msg: Message) {
        this.player.filters.reset();

        await this.player.filters.apply();

        msg.reply('All Audio filters cleared!');
    }

    setMoonlinkPlayer(player: Player): void {
        this.player = player;
    }
}
