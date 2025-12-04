import { Attachment, Message } from 'discord.js';
import { AudioPlayerStatus, VoiceConnection } from '@discordjs/voice';
import { AudioPlayerManager } from '../audio/player.ts';
import { Queue } from '../audio/queue.ts';
import { validateAndGetConnection } from '../utils/voiceChannel.ts';
import { downloadSongFile, isValidAudioFile, fileExists } from '../utils/fileHandler.ts';
import path from 'path';
import fs from 'fs';
import fetch from 'node-fetch';
import { client } from '../index.ts';
import { Manager, Player } from 'moonlink.js';


export class MusicCommands {
    private moonlinkPlayer: any;
    private isCreated = false;
    constructor(
        private playerManager: AudioPlayerManager,
        private queue: Queue,
        private tempDir: string, 
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
            console.log(args.join(" "))
            const string = args.join(" ")
            await this.handleFileInput(msg, string, connection);
            return;
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

        if (!this.isCreated){
            this.createMoonlinkPlayer(msg);
        }

        const songUrl = await fetch(attachment.url);
        const result = await client.manager.search({query: songUrl.url});
        if (result.tracks.length < 1) {
                console.log('No tracks found');
                return;
            } else {
                this.moonlinkPlayer.queue.add(result.tracks[0]);
                msg.reply(`${result.tracks[0].title} has been added to the queue!`);
                if (!this.moonlinkPlayer.playing){
                  this.moonlinkPlayer.play();
                    
                  msg.reply(`Playing ${result.tracks[0].title}`);
                  return;
                } 
            }


        // const filePath = await downloadSongFile(attachment, this.tempDir, attachment.name);
        // if (!filePath) {
        //     msg.reply('Failed to download the file.');
        //     return;
        // }

        // if (this.queue.isFull()) {
        //     msg.reply('Playlist is full! Please wait for current songs to finish before adding more.');
        //     return;
        // }

        // this.queue.add(filePath, true);
        // const songName = this.getSongName(filePath);

        // if (this.playerManager.isIdle()) {
        //     this.playerManager.play(connection, msg.guild!.id);
        //     msg.reply(`~Playing Now: **${songName}**~`);
        // } else {
        //     msg.reply(`**${songName}** has been added to the queue!`);
        // }
    }

    // Check to see what type of url it is.
    // Play-dl uses Soundcloud, Spotify, Youtube
    // Create Helper function to ensure soundcloud link?

    private async handleFileInput(
        msg: Message,
        input: string,
        connection: VoiceConnection
    ): Promise<void> {
        if (input.startsWith('http://') || input.startsWith('https://')) {
            await this.handleUrlInput(msg, input, connection);
            return;
        }

        if (!this.isCreated){
            this.createMoonlinkPlayer(msg);
        }

        // const filePath = path.resolve(input);
        // if (!fileExists(filePath)) {
        //     msg.reply('File not found! Please provide a valid file path or URL.');
        //     return;
        // }

        // if (!isValidAudioFile(filePath)) {
        //     msg.reply('Please provide a valid audio file (mp3, wav, ogg, m4a, aac)!');
        //     return;
        // }

        // if (this.queue.isFull()) {
        //     msg.reply('Playlist is full! Please wait for current songs to finish before adding more.');
        //     return;
        // }

        const result = await client.manager.search({query: input});
        const song = result.tracks[0];
        if (result.tracks.length < 1) {
                console.log('No tracks found');
                return;
            } else {
                this.moonlinkPlayer.connect();
                
                this.moonlinkPlayer.queue.add(result.tracks[0]);
                msg.reply(`**${song.title}** has been added to the queue!`);
                if (!this.moonlinkPlayer.playing){
                  this.moonlinkPlayer.play();
                    
                  msg.reply(`~Playing Now: **${song.title}**~`);
                  return;
                } 
            }

        
        // if (this.playerManager.isIdle()) {
        //     this.playerManager.play(connection, msg.guild!.id);
        //     msg.reply(`~Playing Now: **${song.title}**~`);
        // } else {
        //     msg.reply(`**${song.title}** has been added to the queue!`);
        // }
    }

    private async handleUrlInput(
        msg: Message,
        url: string,
        connection: VoiceConnection
    ): Promise<void> {
        const urlPath =  new URL(url).pathname;
        // Check to see if its a youtube or soundcloud link.

        const channelId = connection.joinConfig.channelId;
        if (!channelId) {
            msg.reply('Unable to get voice channel ID from connection.');
            return;
        }

        if (!this.isCreated){
            this.createMoonlinkPlayer(msg);
        }

        if (!isValidAudioFile(url)) {
            console.log("I reach this line before imploding on myself");
            this.moonlinkPlayer.connect();
        
            const results = await client.manager.search({ query: url });
            if (results.tracks.length < 1) {
                console.log('No tracks found');
                return;
            } else {
                this.moonlinkPlayer.queue.add(results.tracks[0]);
                if (!this.moonlinkPlayer.playing){
                  this.moonlinkPlayer.play();
                    
                  msg.reply('PLaying ur noob song');
                  return;
                } 
            }
        } else {
            return;
        }
        
        /* 
            How do i pattern match the link for youtube?

            
        */
        

        // if (!isValidAudioFile(fileName)) {
        //     const defaultFileName = fileName.includes('.') ? fileName : `${fileName}.mp3`;
        //     const filePath = await this.downloadFromUrl(url, defaultFileName);
        //     if (!filePath) {
        //         msg.reply('Failed to download the file from URL.');
        //         return;
        //     }
        //     await this.addToQueueAndPlay(msg, filePath, connection, true);
        // } else {
        //     const filePath = await this.downloadFromUrl(url, fileName);
        //     if (!filePath) {
        //         msg.reply('Failed to download the file from URL.');
        //         return;
        //     }
        //     await this.addToQueueAndPlay(msg, filePath, connection, true);
        // }
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

            // This doesn't work because if the url link returns something other than a
            // valid audio file (HTML,JSON, etc), it won't play anything

            /* 
                Fix?

                -- Import Soundcloud API to handle soundcloud links (need (isSoundcloudLink) func in order to validate)
                -- Use play-dl to stream soundcloud links (May not be allowed since soundcloudAPI exists)
                -- Use Lavalink --> Leading API in using audio server commands (Separate Java Server that I have to connect to alongside the bot)
                   ---> Not prefered

                Lets just incorporate Soundcloud API for now (play-dl is dead)
                 -- Soundcloud is making me register the app just to use the API (faaah)
                  -- Can't even find the link to register (link on website is dead) ((faaaaah))

                Lavalink it is.
                1: Lavalink is installed and running (How do i close this?)
                2: 


            */




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
        if (!result){ 
            msg.reply("You aren't in the vc.") 
            return;
        }
        
        if (this.moonlinkPlayer.pause()) {
            msg.reply('Player was successfully paused');
        } else {
            msg.reply('Nothing is playing to pause');
        }
    }

    handleUnpause(msg: Message): void {
        const result = validateAndGetConnection(msg);
         if (!result){ 
            msg.reply("You aren't in the vc.") 
            return;
        }

        if (this.moonlinkPlayer.resume()) {
            msg.reply('Song has been unpaused');
        } else {
            msg.reply('Nothing is paused');
        }
    }

    handleSkip(msg: Message): void {
        const result = validateAndGetConnection(msg);
        if (!result) return;

        if (!(this.moonlinkPlayer.playing && this.moonlinkPlayer.paused)) {
            msg.reply('Nothing is playing')
        } else {
            this.moonlinkPlayer.skip();
        }
    }

    handleLoop(msg: Message): void {
        const result = validateAndGetConnection(msg);
        if (!result) return;

        if (!(this.moonlinkPlayer.playing && this.moonlinkPlayer.paused)) {
            msg.reply('Nothing is playing')
        } else {
            this.moonlinkPlayer.setLoop('track');
        }
    }

    handleStopLoop(msg: Message): void {
        const result = validateAndGetConnection(msg);
        if (!result) return;

        if (!(this.moonlinkPlayer.playing && this.moonlinkPlayer.paused)) {
            msg.reply('Nothing is playing')
        } else {
            this.moonlinkPlayer.setLoop('off');
        }
    }

    createMoonlinkPlayer(msg: Message): void {
        const result = validateAndGetConnection(msg);
        if (!result) return;

        const { voiceChannel, connection } = result;

        const channelId = connection.joinConfig.channelId;
        if (!channelId) {
            msg.reply('Unable to get voice channel ID from connection.');
            return;
        } //Javascript can see if you null check your variables (Thats actually pretty cool)

        this.moonlinkPlayer = client.manager.createPlayer({
                guildId: connection.joinConfig.guildId,
                voiceChannelId: channelId,
                textChannelId: msg.channel.id,
                autoPlay: false,
        });

        this.isCreated = true;
    }

    getMoonlinkPlayer(): Player {
        return this.moonlinkPlayer;
    }

    
}
