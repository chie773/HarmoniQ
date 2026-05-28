// src/commands/music/AudioMixCommands.ts
import { Message } from 'discord.js';
import { Player } from 'moonlink.js';
import { validateAndGetConnection } from '../utils/voiceChannel.js';
import { FILTERS } from './EQPresets.js';

export class AudioMixCommands {
    private player: Player; // Moonlink / Lavalink player

    constructor(player: Player) {
        this.player = player;
    }

    setVolume(msg: Message, args: string) {
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

    setRock(msg: Message) {
        const result = validateAndGetConnection(msg);
        if (!result) return;

        const { connection } = result;
        if (!connection) {
            msg.reply(`I'm not in a voice channel!`);
            return;
        }

        this.player.filters.setEqualizer(FILTERS.Rock);
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

        this.player.filters.setEqualizer(FILTERS.BassBoost);
        msg.reply(`🎚️ Bass Boost preset applied!`);
    }

    setPop(msg: Message) {
        const result = validateAndGetConnection(msg);
        if (!result) return;
        const { connection } = result;
        if (!connection) return msg.reply(`I'm not in a voice channel!`);

        this.player.filters.setEqualizer(FILTERS.Pop);
        msg.reply(`🎤 Pop preset applied!`);
    }

    setJazz(msg: Message) {
        const result = validateAndGetConnection(msg);
        if (!result) return;
        const { connection } = result;
        if (!connection) return msg.reply(`I'm not in a voice channel!`);

        this.player.filters.setEqualizer(FILTERS.Jazz);
        msg.reply(`🎷 Jazz preset applied!`);
    }

    setDeep(msg: Message) {
        const result = validateAndGetConnection(msg);
        if (!result) return;
        const { connection } = result;
        if (!connection) return msg.reply(`I'm not in a voice channel!`);

        this.player.filters.setEqualizer(FILTERS.Deep);
        msg.reply(`🔊 Deep preset applied!`);
    }

    setFlat(msg: Message) {
        const result = validateAndGetConnection(msg);
        if (!result) return;
        const { connection } = result;
        if (!connection) return msg.reply(`I'm not in a voice channel!`);

        this.player.filters.setEqualizer(FILTERS.Flat);
        msg.reply(`⚪ Flat preset applied!`);
    }

    setHipHop(msg: Message) {
        const result = validateAndGetConnection(msg);
        if (!result) return;
        const { connection } = result;
        if (!connection) return msg.reply(`I'm not in a voice channel!`);

        this.player.filters.setEqualizer(FILTERS.HipHop);
        msg.reply(`🎧 Hip-Hop preset applied!`);
    }

    setClassical(msg: Message) {
        const result = validateAndGetConnection(msg);
        if (!result) return;
        const { connection } = result;
        if (!connection) return msg.reply(`I'm not in a voice channel!`);

        this.player.filters.setEqualizer(FILTERS.Classical);
        msg.reply(`🎼 Classical preset applied!`);
    }

    setSpokenWord(msg: Message) {
        const result = validateAndGetConnection(msg);
        if (!result) return;
        const { connection } = result;
        if (!connection) return msg.reply(`I'm not in a voice channel!`);

        this.player.filters.setEqualizer(FILTERS.SpokenWord);
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
        const result = validateAndGetConnection(msg);
        if (!result) return;

        const { connection } = result;
        if (!connection) return msg.reply(`I'm not in a voice channel!`);

        this.player.filters.setRotation({
            rotationHz: 0.1  // Slow rotation
        });
    }

    setSlowedReverb(msg: Message){
        const result = validateAndGetConnection(msg);
        if (!result) return;

        const { connection } = result;
        if (!connection) return msg.reply(`I'm not in a voice channel!`);

        this.player.filters.setTimescale({
            speed: 0.87,  // half speed
            pitch: 0.87,  // keep normal pitch
            rate: 1.0
        });
    }

    clearFilters(msg: Message) {
        this.player.filters.reset();
        msg.reply('All Audio filters cleared!');
    }

    setMoonlinkPlayer(player: Player): void {
        this.player = player;
    }
}
