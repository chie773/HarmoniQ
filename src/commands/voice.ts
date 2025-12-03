import { Message } from 'discord.js';
import { joinVoiceChannel, getVoiceConnection } from '@discordjs/voice';
import { validateVoiceChannel, getOrCreateConnection } from '../utils/voiceChannel.ts';
import { client } from '../index.ts';

export function handleJoin(msg: Message): void {
    const voiceChannel = validateVoiceChannel(msg);
    if (!voiceChannel) return;

    const connection = getOrCreateConnection(voiceChannel);
    if (!connection) {
        msg.reply('I\'m currently in another voice channel. Please try again later.');
        return;
    }

    msg.reply(`Joined **${voiceChannel.name}**`);
}

export function handleLeave(msg: Message): void {
    const voiceChannel = msg.member?.voice?.channel;
    const connection = getVoiceConnection(msg.guild!.id);

    if (!connection) {
        msg.reply("I'm not in a voice channel!");
        return;
    }

    if (!msg.guildId){
        return;
    }

    const moonlinkPlayer = client.manager.players.get(msg.guildId);
    if (moonlinkPlayer && moonlinkPlayer.voiceChannelId) {
        moonlinkPlayer.destroy();
        const channelName = voiceChannel?.name || 'the voice channel';
        msg.reply(`Left **${channelName}**`);
    } else {
        connection.destroy();
        const channelName = voiceChannel?.name || 'the voice channel';
        msg.reply(`Left **${channelName}**`);
    }    
}
