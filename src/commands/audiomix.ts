// src/commands/music/AudioMixCommands.ts
import { Message } from 'discord.js';
import { Player } from 'moonlink.js';
import { validateAndGetConnection } from '../utils/voiceChannel';
import { EQPresets } from './EQPresets';

export class AudioMixCommands {
    private player: Player; // Moonlink / Lavalink player

    constructor(player: Player) {
        this.player = player;
    }

    setVolume(msg: Message, volume: number) {
        const result = validateAndGetConnection(msg);
        if (!result) return;
        
        const { voiceChannel, connection } = result;
        
        if (!connection) {
            msg.reply(`I'm not in a voice channel!`);
            return;
        }

        if (!this.player?.playing) {
            return msg.reply('Nothing is playing.');
        }

        if (volume < 0 || volume > 100) {
            return msg.reply('Volume must be between 0 and 100.');
        }

        this.player.setVolume(volume);
        msg.reply(`🔊 Volume set to **${volume}%**`);
    }

    setRock(msg: Message) {
        const result = validateAndGetConnection(msg);
        if (!result) return;

        const { connection } = result;
        if (!connection) {
            msg.reply(`I'm not in a voice channel!`);
            return;
        }

        this.player.filters.setEqualizer(EQPresets.Rock);
        msg.reply(`🎸 Rock preset applied!`);
    }

    setBassBoost(msg: Message) {
        const result = validateAndGetConnection(msg);
        if (!result) return;

        const { connection } = result;
        if (!connection) {
            msg.reply(`I'm not in a voice channel!`);
            return;
        }

        this.player.filters.setEqualizer(EQPresets.BassBoost);
        msg.reply(`🎚️ Bass Boost preset applied!`);
    }

    setPop(msg: Message) {
        const result = validateAndGetConnection(msg);
        if (!result) return;
        const { connection } = result;
        if (!connection) return msg.reply(`I'm not in a voice channel!`);

        this.player.filters.setEqualizer(EQPresets.Pop);
        msg.reply(`🎤 Pop preset applied!`);
    }

    setJazz(msg: Message) {
        const result = validateAndGetConnection(msg);
        if (!result) return;
        const { connection } = result;
        if (!connection) return msg.reply(`I'm not in a voice channel!`);

        this.player.filters.setEqualizer(EQPresets.Jazz);
        msg.reply(`🎷 Jazz preset applied!`);
    }

    setDeep(msg: Message) {
        const result = validateAndGetConnection(msg);
        if (!result) return;
        const { connection } = result;
        if (!connection) return msg.reply(`I'm not in a voice channel!`);

        this.player.filters.setEqualizer(EQPresets.Deep);
        msg.reply(`🔊 Deep preset applied!`);
    }

    setFlat(msg: Message) {
        const result = validateAndGetConnection(msg);
        if (!result) return;
        const { connection } = result;
        if (!connection) return msg.reply(`I'm not in a voice channel!`);

        this.player.filters.setEqualizer(EQPresets.Flat);
        msg.reply(`⚪ Flat preset applied!`);
    }

    setHipHop(msg: Message) {
        const result = validateAndGetConnection(msg);
        if (!result) return;
        const { connection } = result;
        if (!connection) return msg.reply(`I'm not in a voice channel!`);

        this.player.filters.setEqualizer(EQPresets.HipHop);
        msg.reply(`🎧 Hip-Hop preset applied!`);
    }

    setClassical(msg: Message) {
        const result = validateAndGetConnection(msg);
        if (!result) return;
        const { connection } = result;
        if (!connection) return msg.reply(`I'm not in a voice channel!`);

        this.player.filters.setEqualizer(EQPresets.Classical);
        msg.reply(`🎼 Classical preset applied!`);
    }

    setSpokenWord(msg: Message) {
        const result = validateAndGetConnection(msg);
        if (!result) return;
        const { connection } = result;
        if (!connection) return msg.reply(`I'm not in a voice channel!`);

        this.player.filters.setEqualizer(EQPresets.SpokenWord);
        msg.reply(`🗣️ Spoken Word preset applied!`);
    }

    setSpeed2x(msg: Message) {
        const result = validateAndGetConnection(msg);
        if (!result) return;

        const { connection } = result;
        if (!connection) return msg.reply(`I'm not in a voice channel!`);

        this.player.filters.setTimescale({
            speed: 2.0,  // double speed
            pitch: 2.0,  // keep normal pitch
            rate: 1.0
        });

        msg.reply(`⏩ Playback speed set to 2x!`);
    }

    setSpeedHalf(msg: Message) {
        const result = validateAndGetConnection(msg);
        if (!result) return;

        const { connection } = result;
        if (!connection) return msg.reply(`I'm not in a voice channel!`);

        this.player.filters.setTimescale({
            speed: 0.5,  // half speed
            pitch: 0.5,  // keep normal pitch
            rate: 1.0
        });

        msg.reply(`🐢 Playback speed set to 0.5x!`);
    }

    set8DAudio(msg: Message) {
        // Apply 8D audio effect
        this.player.filters.setRotation({
            rotationHz: 0.3  // Slow rotation
        });
    }

    clearFilters(msg: Message) {
        this.player.filters.resetFilters();
        msg.reply('All Audio filters cleared!');
    }

    setMoonlinkPlayer(player: Player): void {
        this.player = player;
    }
}
