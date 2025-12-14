import { Attachment, Message } from 'discord.js';
import { getVoiceConnection, VoiceConnection } from '@discordjs/voice';
import { AudioPlayerManager } from '../audio/player.ts';
import { Queue } from '../audio/queue.ts';
import { validateAndGetConnection } from '../utils/voiceChannel.ts';
import { downloadSongFile, isValidAudioFile, fileExists } from '../utils/fileHandler.ts';
import path from 'path';
import fs from 'fs';
import fetch from 'node-fetch';
import { client } from '../index.ts';
import { Manager, Player } from 'moonlink.js';
import { stringify } from 'querystring';
import { isYouTubePlaylistUrl, extractPlaylistId, getPlaylistVideoTitles } from './youtube.ts';


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

        if (!this.isCreated){
            this.createMoonlinkPlayer(msg);
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
        if (isYouTubePlaylistUrl(url)) {
            await this.handlePlaylistInput(msg, url, connection);
            return;
        }

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

    handleStop(msg: Message): void {
        const result = validateAndGetConnection(msg);
        if (!result) return;

        const connection = getVoiceConnection(msg.guild!.id);

        if (!connection) {
            msg.reply("I'm not in a voice channel!");
            return;
        }

        if (this.moonlinkPlayer.playing || this.moonlinkPlayer.paused) {
            this.moonlinkPlayer.setLoop('off');
            this.moonlinkPlayer.stop()
            msg.reply("Player has been stopped!")
        } else {
            msg.reply('Nothing is playing')
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

    handleViewQueue(msg: Message, args: string[]): void {
        const result = validateAndGetConnection(msg);
        if (!result) return;

        const connection = getVoiceConnection(msg.guild!.id);

        if (!connection) {
            msg.reply("I'm not in a voice channel!");
            return;
        }

        try {
            const startIndex = args.length > 0 ? parseInt(args[0], 10) : 0;
            const isValidStart = !isNaN(startIndex) && startIndex >= 0;
            const actualStart = isValidStart ? startIndex : 0;

            const currentSong = this.moonlinkPlayer.current?.title ?? "Nothing at the moment";
            let replyMsg = `Now Playing: ${currentSong}\n\nThese are the songs currently in the queue:\n`;

            if (!this.moonlinkPlayer.queue.isEmpty) {
                const MAX_LENGTH = 1990;
                const BUFFER = 50;
                const tracks = this.moonlinkPlayer.queue.tracks;

                let queueText = '';
                for (let i = actualStart; i < tracks.length; i++) {
                    const trackLine = `${i}. ${tracks[i].title}\n`;

                    if ((replyMsg + queueText + trackLine).length > (MAX_LENGTH - BUFFER)) {
                        const remaining = tracks.length - i;
                        queueText += `\n... and ${remaining} more song${remaining !== 1 ? 's' : ''}`;
                        break;
                    }

                    queueText += trackLine;
                }

                msg.reply(replyMsg + queueText);
            } else {
                msg.reply(replyMsg + `There is nothing in the queue, please add something :)`);
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
            const duration = this.moonlinkPlayer.current.duration; // milliseconds
            const position = this.moonlinkPlayer.current.position;

            const Phours = Math.floor(position / 3_600_000);
            const Pminutes = Math.floor((position % 3_600_000) / 60_000);
            const Pseconds = Math.floor((position % 60_000) / 1_000);

            const hours = Math.floor(duration / 3_600_000);
            const minutes = Math.floor((duration % 3_600_000) / 60_000);
            const seconds = Math.floor((duration % 60_000) / 1_000);

            msg.reply(`Now Playing: ${this.moonlinkPlayer.current.title ?? "Nothing at the moment"}\nCurrent Song Duration:\n~${Phours}:${Pminutes.toString().padStart(2, '0')}:${Pseconds.toString().padStart(2, '0')}~ | ~${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}~`
            );
        } else {
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

    async handleSkipTo(msg: Message, songNumber: string): Promise<void> {
        const result = validateAndGetConnection(msg);
        if (!result) return;

        const connection = getVoiceConnection(msg.guild!.id);
        
        if (!connection) {
            msg.reply(`I'm not in a voice channel!`);
            return;
        }

        try {
            const songPosition = parseInt(songNumber, 10);
            if (await this.moonlinkPlayer.queue.jump(songPosition)) {
                msg.reply(`Successfully skipped to ${this.moonlinkPlayer.queue.track.title}`);
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
        

    handleSeek(msg: Message, seconds: string[]) {
        const result = validateAndGetConnection(msg);
        if (!result) return;

        const connection = getVoiceConnection(msg.guild!.id);
        
        if (!connection) {
            msg.reply(`I'm not in a voice channel!`);
            return;
        }
        
        try {
            if (this.moonlinkPlayer.playing || this.moonlinkPlayer.paused) {
                const seekAmount = parseInt(seconds.join(" "), 10);
                if (isNaN(seekAmount) || seekAmount === 0){
                    // TODO: add err msg here
                    return;
                }
                
                const currPosition = this.moonlinkPlayer.current.position;
                const songDuration = this.moonlinkPlayer.current.duration;
                const newPosition = (seekAmount * 1000) + currPosition;

                if (newPosition >= songDuration) {
                    // TODO: message for skipping
                    // check if we really need async here, ill let you handle that jit
                    if (this.moonlinkPlayer.loop === 'track'){
                        this.moonlinkPlayer.seek(0);
                        return;
                    } else {
                        this.moonlinkPlayer.skip();
                        return;
                    }
                }
                
                if (newPosition <= 0) {
                    if (this.moonlinkPlayer.loop === 'track'){
                        this.moonlinkPlayer.seek(0);
                        return;
                    } else {
                        this.moonlinkPlayer.seek(0);
                        return;
                    }
                }

                this.moonlinkPlayer.seek(newPosition);
                
                if (seekAmount > 0) {
                    msg.reply(`Fast Forward by ${seekAmount}`);
                } else {
                    msg.reply(`Went back by ${seekAmount}`);
                }
            } else {
                msg.reply("nothing to play jit");
            }
        } catch (e) {
            console.log(e);
            msg.reply('Command not availiable right now, try again later!');
        }
    }

    private async handlePlaylistInput(
        msg: Message,
        url: string,
        connection: VoiceConnection
    ): Promise<void> {
        const playlistId = extractPlaylistId(url);
        if (!playlistId) {
            msg.reply('Invalid YouTube playlist URL!');
            return;
        }

        if (!this.isCreated) {
            this.createMoonlinkPlayer(msg);
        }

        try {
            msg.reply('Fetching playlist...');

            const videoTitles = await getPlaylistVideoTitles(playlistId);

            if (videoTitles.length === 0) {
                msg.reply('No videos found in the playlist!');
                return;
            }

            console.log(`Found ${videoTitles.length} videos in playlist`);

            this.moonlinkPlayer.connect();

            let addedCount = 0;
            for (const title of videoTitles) {
                try {
                    console.log(`Searching for: ${title}`);
                    const results = await client.manager.search({ query: title });
                    console.log(`Search results for "${title}": ${results.tracks.length} tracks found`);
                    if (results.tracks.length > 0) {
                        this.moonlinkPlayer.queue.add(results.tracks[0]);
                        addedCount++;
                    }
                } catch (error) {
                    console.error(`Failed to search for: ${title}`, error);
                }
            }

            if (addedCount > 0) {
                msg.reply(`Added ${addedCount} songs from the playlist to the queue!`);

                if (!this.moonlinkPlayer.playing && !this.moonlinkPlayer.paused) {
                    this.moonlinkPlayer.play();
                    const currentTrack = this.moonlinkPlayer.current;
                    if (currentTrack) {
                        msg.reply(`~Playing Now: **${currentTrack.title}**~`);
                    }
                }
            } else {
                msg.reply('Could not find any tracks from the playlist!');
            }
        } catch (error) {
            console.error('Error handling playlist:', error);
            msg.reply('Failed to fetch playlist. Please check the URL and try again.');
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
