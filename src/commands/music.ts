import { Attachment, Message } from 'discord.js';
import { AudioPlayerStatus, getVoiceConnection, VoiceConnection } from '@discordjs/voice';
import { AudioPlayerManager } from '../audio/player.ts';
import { Queue } from '../audio/queue.ts';
import { validateAndGetConnection } from '../utils/voiceChannel.ts';
import { downloadSongFile, isValidAudioFile, fileExists } from '../utils/fileHandler.ts';
import path from 'path';
import fs from 'fs';
import fetch from 'node-fetch';
import { client } from '../index.ts';
import { Manager, Player, Track } from 'moonlink.js';
import { stringify } from 'querystring';


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
            msg.reply("Please attach an audio file or state what you want to play");
            return
            await this.handleQueuePlay(msg, connection); // --> Crashes

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
                if (!(this.moonlinkPlayer.playing || this.moonlinkPlayer.paused)){ // What am i trying to do? If the player is playing or paused, queue the next song and dont change player state
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
                if (!this.moonlinkPlayer.playing && !this.moonlinkPlayer.paused){
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
                msg.reply(`**${results.tracks[0].title}** has been added to the queue!`);
                if (!this.moonlinkPlayer.playing && !this.moonlinkPlayer.paused){
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
        if (!this.isCreated){
            this.createMoonlinkPlayer(msg);
        }
        if (this.moonlinkPlayer.queue.isEmpty()) {
            msg.reply('Please Tell Me what song you want to play!');
            return;
        }

        if (this.moonlinkPlayer.idle) {
            this.moonlinkPlayer.play();
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
        const connection = getVoiceConnection(msg.guild!.id);

        if (!connection) {
            msg.reply("I'm not in a voice channel!");
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
        const connection = getVoiceConnection(msg.guild!.id);

        if (!connection) {
            msg.reply("I'm not in a voice channel!");
            return;
        }

        if (this.moonlinkPlayer.resume()) {
            msg.reply('Song has been unpaused');
        } else {
            msg.reply('Nothing is paused');
        }
    }

    async handleSkip(msg: Message): Promise<void> {
        const result = validateAndGetConnection(msg);
        if (!result) return;

        const connection = getVoiceConnection(msg.guild!.id);

        if (!connection) {
            msg.reply("I'm not in a voice channel!");
            return;
        }

        if (this.moonlinkPlayer.playing || this.moonlinkPlayer.paused) {
            await this.moonlinkPlayer.skip();
            this.moonlinkPlayer.setLoop('off');
            this.handleCurrentSong(msg);
        } else {
            msg.reply('Nothing is playing');
        }
    }

    handleLoop(msg: Message): void {
        const result = validateAndGetConnection(msg);
        if (!result) return;

        const connection = getVoiceConnection(msg.guild!.id);

        if (!connection) {
            msg.reply("I'm not in a voice channel!");
            return;
        }

        if (this.moonlinkPlayer.playing || this.moonlinkPlayer.paused) {
            this.moonlinkPlayer.setLoop('track');
            msg.reply("Looping Track");
        } else {
            msg.reply("Nothing is playing :P");
        }
    }

    handleStopLoop(msg: Message): void {
        const result = validateAndGetConnection(msg);
        if (!result) return;

        const connection = getVoiceConnection(msg.guild!.id);

        if (!connection) {
            msg.reply("I'm not in a voice channel!");
            return;
        }

        if (this.moonlinkPlayer.playing || this.moonlinkPlayer.paused) {
            this.moonlinkPlayer.setLoop('off');
            msg.reply("Loop is turned off")
        } else {
            msg.reply('Nothing is playing')
        }
    }

    handleViewQueue(msg: Message): void {
        const result = validateAndGetConnection(msg);
        if (!result) return;
        
        const connection = getVoiceConnection(msg.guild!.id);

        if (!connection) {
            msg.reply("I'm not in a voice channel!");
            return;
        }

        try {
            const replyMsg = `Now Playing: ${this.moonlinkPlayer.current.title ?? "Nothing at the moment"}\n\nThis are the songs currently in the queue:\n`;
            if (!this.moonlinkPlayer.queue.isEmpty) {
                let pos = 0;

                const queueList = this.moonlinkPlayer.queue.tracks
                                            .map((track: Track, idx: number) => `${idx}. ${track.title}`)
                                            .join("\n");

                msg.reply(replyMsg + queueList);
            } else {
                msg.reply(replyMsg + `1. There is nothing in the queue, please add something :)`);
            }
        } catch (e) {
            console.log(e)
            msg.reply(`Unable to execute command, please try again later`);
            return;
        }
    }

    handleSongDuration(msg: Message): void {
        const result = validateAndGetConnection(msg);
        if (!result) return;

        const connection = getVoiceConnection(msg.guild!.id);

        if (!connection) {
            msg.reply(`I'm not in a voice channel!`);
            return;
        }

        if (this.moonlinkPlayer.playing || this.moonlinkPlayer.paused) {
            
            const songDuration = this.moonlinkPlayer.current.duration;
            
            const Minutes = songDuration / 6000;
            // Song Duration -> Conver to minutes
            // Remove How many minutes (Minutes - SongDuration)
            // Song Duration -> Convert to Seconds
            


            const Seconds = ((Minutes * 6000) -  songDuration) / 1000;
            
            msg.reply(`Current Song Duration:\n${Minutes} : ${Seconds}`);
        }  
        else {
            msg.reply(`Nothing is playing. Add a song!`);
        }
    }

    handleShuffleQueue(msg: Message): void {
        const result = validateAndGetConnection(msg);
        if (!result) return;

        const connection = getVoiceConnection(msg.guild!.id);
        if (!connection) {
            msg.reply(`I'm not in a voice channel!`);
            return;
        }

        if (this.moonlinkPlayer.queue.shuffle()) {
            msg.reply(`The queue has been shuffled! Enjoy listening!`);
        }
        else {
            msg.reply('Unable to shuffle queue, please try again.');
        }
    }

    handleClearQueue(msg: Message): void {
        const result = validateAndGetConnection(msg);
        if (!result) return;

        const connection = getVoiceConnection(msg.guild!.id);
        if (!connection) {
            msg.reply(`I'm not in a voice channel!`);
            return;
        }

        if (this.moonlinkPlayer.queue.clear()) {
            msg.reply(`The queue has been cleared. Add new songs to the queue.`);
        } else {
            msg.reply('Unable to clear queue, please try again.');
        }
    }

    handleRemoveFromQueue(msg: Message, url: string[]): void {
        try{ 
            const result = validateAndGetConnection(msg);
            if (!result) return;
    
            const connection = getVoiceConnection(msg.guild!.id);
            if (!connection) {
                msg.reply(`I'm not in a voice channel!`);
                return;
            }
    
            const string = url.join(" ");
            const position = parseInt(string);
            
            if (position > this.moonlinkPlayer.queue.size) {
                msg.reply(`The requested position in the queue doesn't exist.`);
                return;
            }
            
            const songName = this.moonlinkPlayer.queue.get(position - 1);
            console.log(position - 1); 
    
            if(!this.moonlinkPlayer.queue.isEmpty){
                this.moonlinkPlayer.queue.remove(position - 1);
                msg.reply(`${songName.title} has been removed from the queue!`);
            }
        } catch (e) {
            console.log(e);
            msg.reply("hey this broke, chi go fix you geek")
        }
    }

    handleSkipTo(msg: Message, songNumber: string): void {
        const result = validateAndGetConnection(msg);
        if (!result) return;

        const connection = getVoiceConnection(msg.guild!.id);
        
        if (!connection) {
            msg.reply(`I'm not in a voice channel!`);
            return;
        }

        try {
            const songPosition = parseInt(songNumber, 10);
            if (this.moonlinkPlayer.queue.SkipTo(songPosition)) {
                msg.reply(`Successfully skipped to ${this.moonlinkPlayer.queue.track.title}`);
                this.handleCurrentSong(msg);
            } else {
                msg.reply(`Unable to skip to requested Song Position, Please try again.`);
            }
        } catch (e) {
            console.log(e);
            msg.reply(`Unable to skip to song, Please Try Again.`);
        }
    }

    handleCurrentSong(msg: Message): void {
        const result = validateAndGetConnection(msg);
        if (!result) return;

        const connection = getVoiceConnection(msg.guild!.id);
        
        if (!connection) {
            msg.reply(`I'm not in a voice channel!`);
            return;
        }

        if (this.moonlinkPlayer.playing || this.moonlinkPlayer.paused) {
            msg.reply(`Currently Playing: ${this.moonlinkPlayer.current.title}`);
        } else {
            msg.reply(`Can't display current song OR nothing is playing. Please try again`);
        }
    }

    handleSeek(msg: Message, seconds: string[]): void {
        const result = validateAndGetConnection(msg);
        if (!result) return;

        const connection = getVoiceConnection(msg.guild!.id);
        
        if (!connection) {
            msg.reply(`I'm not in a voice channel!`);
            return;
        }
        
        try{
            if (this.moonlinkPlayer.playing || this.moonlinkPlayer.paused) {
                let time = parseInt(seconds.join(' '), 10) * 1000;
                if (time === 0) {
                    return;
                }

                this.moonlinkPlayer.seek(time);

                if (time > 0) {
                    msg.reply(`Song has fast-fowarded ${time/1000} seconds.`);
                } else {
                    msg.reply(`Song has rewinded ${time/1000} seconds.`);
                }
            } else {    
                msg.reply(`Unable to seek, L + Ratio + you Sux`);
            }
        } catch (e) {
            console.log(e);
            msg.reply('Why dont you work :CCCCCC');
        }
        

    }






    //SkipTo (use queue.jump(x))
    





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
