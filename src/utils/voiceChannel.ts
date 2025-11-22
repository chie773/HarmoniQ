import { Message, VoiceBasedChannel } from 'discord.js';
import { getVoiceConnection, joinVoiceChannel, VoiceConnection } from '@discordjs/voice';

export function validateVoiceChannel(msg: Message): VoiceBasedChannel | null {
    const voiceChannel = msg.member?.voice?.channel;
    if (!voiceChannel) {
        msg.reply('You need to be in a voice channel first!');
        return null;
    }
    return voiceChannel;
}

export function getOrCreateConnection(voiceChannel: VoiceBasedChannel): VoiceConnection | null {
    let connection = getVoiceConnection(voiceChannel.guild.id);

    if (connection) {
        if (connection.joinConfig.channelId !== voiceChannel.id) {
            return null;
        }
        return connection;
    }

    connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        selfDeaf: false,
        selfMute: false
    });

    return connection;
}

export function validateAndGetConnection(msg: Message): { voiceChannel: VoiceBasedChannel; connection: VoiceConnection } | null {
    const voiceChannel = validateVoiceChannel(msg);
    if (!voiceChannel) return null;

    const connection = getOrCreateConnection(voiceChannel);
    if (!connection) {
        msg.reply('I\'m currently in another voice channel. Please try again later.');
        return null;
    }

    return { voiceChannel, connection };
}
