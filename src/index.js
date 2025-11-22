require('dotenv').config(); // Requires the file of the TOKEN in order for the bot to run on alien pcs
const { Client, IntentsBitField} = require('discord.js'); //Bascially, it's importing specific libraries from discord.js (the client and IntentsBitField library)
const { AudioPlayerStatus, NoSubscriberBehavior, createAudioPlayer, createAudioResource, StreamType, joinVoiceChannel, getVoiceConnection, generateDependencyReport, VoiceConnection } = require('@discordjs/voice'); // //Imports vc commands because vc commands are a separate library
const path = require('path');
const fs = require('fs');
const { Song } = require('./song')

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const ffmpegPath = require('ffmpeg-static');
const { ytsong } = require('./playYoutubeSongs');
const { UserSelectMenuComponent } = require('discord.js');
const { zstdCompress } = require('zlib');

let playlist = []; // This is where the playlist queue will be stored




let player; // This is for our audioPlayer so the other functions will work
let loopActive; // This checks to see if user has activated loop feature

const tempDir = path.join(__dirname, 'temp'); // Creates a temporary folder within local system
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir); //Checks to see if folder exists, if not it is created

async function addTempFilesToPlaylist() {

    const allowedExts = new Set(['.mp3', '.wav', '.ogg', '.m4a', '.aac']);
    const added = [];

    try {
        const files = fs.readdirSync(tempDir);
        for (const name of files) {
            const fullPath = path.join(tempDir, name);
            let stat;
            try { stat = fs.statSync(fullPath); } catch { continue; }
            if (!stat.isFile()) continue;

            const ext = path.extname(name).toLowerCase();
            if (!allowedExts.has(ext)) continue;

            if (!playlist.includes(fullPath)) {
                playlist.push(fullPath);
                added.push(fullPath);
            }
        }

        console.log("Added current files in temp folder");
    } catch (err) {
        console.error('Failed to read temp folder:', err);
    }

    console.log(playlist);
}

addTempFilesToPlaylist();



/* Client -- Main connections with discord from bot, listens to events happening inside the server, while sending actions back
    IntentsBitField -- Allows you to specify which events you want the bot to listen to */

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds, // Access to Server Events
        IntentsBitField.Flags.GuildMembers, // Access to Server Member Events
        IntentsBitField.Flags.GuildMessages, // Access to Server Message Events
        IntentsBitField.Flags.MessageContent, // Access to Content within messages
        IntentsBitField.Flags.GuildVoiceStates,
    ]
})

client.on('clientReady', (c) => {
    console.log(`${c.user.displayName} is online.`) // Alerts that bot is online.
});


client.on('messageCreate', async (msg) => {
    if (msg.author.bot) return; // ignore bot messages!

    const args = msg.content.trim().split(/ +/); //Ensures there is no whitespace in message (cleaner usage) && separates into an array of words
    const command = args.shift().toLowerCase(); //Shift removes the first element in the array and returns (kinda like popping from stack)
                                                // we know what toLowerCase means

    switch(command) {
        case '!join':
            handleJoin(msg); // Calls the join function for the bot
            break;

        case '!leave':
            handleLeave(msg); // Calls the leave function for the bot
            break;

        case '!echo':
            handleEcho(msg, args); // Handles bot repeating messages
            break;

        case 'hello':
            handleHello(msg); // Simple "hi" function
            break;
        
        case '!play':
            playSong(msg, args);
            break;
        
        case '!pause':
            pauseSong(msg);
            break;
        
        case '!unpause':
            unpauseSong(msg);
            break;
        
        case '!loop':
            loopSong(msg);
            break;
        
        case '!unloop':
            stopLoop(msg);
            break;
        
        case '!skip':
            skipSong(msg);
            break;

        default:
            console.log(`Unknown command: ${msg.content}`);
    }
});

// ----------------------
// Command Handlers
// ----------------------

function handleJoin(msg) {
    const voiceChannel = msg.member?.voice?.channel; // The question marks basically make it a (return true OR false) 
    if (!voiceChannel) return msg.reply('You need to be in a voice channel first!'); // error handling call

    joinVoiceChannel({ 
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    }); // Method call for joining a voice channel for a bot (need all three parameters)

    msg.reply(`Joined **${voiceChannel.name}** ✅`); // ${} -> How you can use methods within console.log or statements within strings
                                                    // !!! -- The statement must use (``) --> Tildes
}

function handleLeave(msg) {
    const voiceChannel = msg.member.voice.channel;
    const connection = getVoiceConnection(msg.guild.id); // Handles leaving the voice channel
    if (!connection) return msg.reply("I'm not in a voice channel!");

    connection.destroy(); // Destroys the connectoins and leaves the vc
    msg.reply(`Left **${voiceChannel.name}** ✅`);
}

function handleEcho(msg, args) {
    if (!args.length) return msg.reply('Please provide a message to echo.');// if array length is null (0)
    msg.reply(args.join(' ')); // rejoins the string array to a actual string, ((I assume this assigns a default whitespace size of 1))
}

function handleHello(msg) {
    msg.reply('hello'); //Hello message
}


async function playSong(msg) {
    const voiceChannel = msg.member?.voice?.channel;
            if (!voiceChannel) return msg.reply("Join a voice channel first!");
        
            let connection = getVoiceConnection(msg.guild.id);

            if (connection) {
                if (connection.joinConfig.channelId !== voiceChannel.id) { //Checks to see if bot is in another channel
                    return msg.reply(`Currently in **${connection.joinConfig.channelId}**, please try again later.`);
                }
                /* For now, lets make it so that it doesn't rejoin but just queues the song being played */
            } else {
                connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: voiceChannel.guild.id,
                    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                    selfDeaf: false,
                    selfMute: false
                })
            }
    
    
    
    const attachment = msg.attachments.first()//Gets the first item in the attachment object (Usually the file you want to upload) --> Not sure if this combats multiple uploads
    if (!attachment) {
        if (playlist.length < 1) {

            return msg.reply("Please attach an mp3 file to play!");
        }
        else{

            // Create audio player
            player = createAudioPlayer();

            // Load MP3 file
            let resource = createAudioResource(fs.createReadStream(playlist[0]), {
            inputType: StreamType.Arbitrary,
            inlineVolume: true
            });

            resource.volume.setVolume(0.3);

            // Play audio
            player.play(resource);
            connection.subscribe(player);
        }
    } else {
        let filePath = await downloadSongFile(attachment, tempDir, attachment.name);
        filePath = filePath.replace(/\\/g, "\\\\");

        console.log(filePath);


        if (playlist.length == 10){
            msg.reply("Playlist is full! Please wait for current songs to finish before adding more.");
        } 
        else if (playlist.length > 0) {
            playlist.push(filePath);
            
            msg.reply("Song has been added to the queue!")
        } else {
            playlist.push(filePath);
        }

        // Create audio player
        player = createAudioPlayer();

        // Load MP3 file
        let resource = createAudioResource(fs.createReadStream(playlist[0]), {
        inputType: StreamType.Arbitrary,
        inlineVolume: true
        });

        resource.volume.setVolume(0.3);


        // Play audio
        player.play(resource);
        connection.subscribe(player);
    }


        player.on('error', console.error);
        player.on('stateChange', (oldState, newState) => {
            if (newState.status === 'playing') {
                console.log("Song is playing");
            }
            if (newState.status === 'idle') {
                console.log("Song is over");
                //Check if song is looped:
                if (loopActive){
                    resource = createAudioResource(playlist[0]);
                    player.play(resource);
                } else {
                    if (attachment && fs.existsSync(playlist[0])) fs.unlinkSync(playlist[0]);
                    if (playlist.length == 0) { 
                        return msg.reply("Queue is now empty, Play a Song!");
                    } else {

                    playlist.shift(); //Deletes the file from the system once done playin && shift playlist
                //If looped, repeat song, else, delete and go to next song or stop playing
                    resource = createAudioResource(playlist[0]);
                    player.play(resource);
                    }
                }
            }   
        });


    msg.reply(`~Playing Now~`);
}    

function pauseSong(msg) {

    const voiceChannel = msg.member?.voice?.channel;
    if (!voiceChannel) return msg.reply("Join a voice channel first!");
    
    let connection = getVoiceConnection(msg.guild.id);

    if (connection) {
        if (connection.joinConfig.channelId !== voiceChannel.id) { //Checks to see if bot is in another channel
            return msg.reply(`Currently in **${connection.joinConfig.channelId}**, please try again later.`);            }
            /* For now, lets make it so that it doesn't rejoin but just queues the song being played */
    } else {
            connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                selfDeaf: false,
                selfMute: false
            })
    }

    if (player.state.status === AudioPlayerStatus.Playing) {
        player.pause();
        msg.reply('player was successfully paused')
    } else {
        msg.reply("couldnt pause");
    }



    
}

function loopSong(msg) {

    const voiceChannel = msg.member?.voice?.channel;
    if (!voiceChannel) return msg.reply("Join a voice channel first!");
    
    let connection = getVoiceConnection(msg.guild.id);

    if (connection) {
        if (connection.joinConfig.channelId !== voiceChannel.id) { //Checks to see if bot is in another channel
            return msg.reply(`Currently in **${connection.joinConfig.channelId}**, please try again later.`);            }
            /* For now, lets make it so that it doesn't rejoin but just queues the song being played */
        }

        

    if (player) {
        if (player.state.status == AudioPlayerStatus.Playing || player.state.status == AudioPlayerStatus.Paused || player.state.status == AudioPlayerStatus.AutoPaused) {
                /* 
                    How would I loop exactly?

                    1. Go to the beginning of the song?? is that even a thing
                    2. Just call 'player.play(resource);' again, it will still be there (lol)
                    i be over complicating things too much
            */
            loopActive = true
            return msg.reply("Song is now Looping!")
        } else {
            return msg.reply("Nothing is Playing...")
        }
    } else {
        return msg.reply("You haven't played anything yet")
    }
}


function stopLoop(msg) {

    const voiceChannel = msg.member?.voice?.channel;
    if (!voiceChannel) return msg.reply("Join a voice channel first!");
    
    let connection = getVoiceConnection(msg.guild.id);

    if (connection) {
        if (connection.joinConfig.channelId !== voiceChannel.id) { //Checks to see if bot is in another channel
            return msg.reply(`Currently in **${connection.joinConfig.channelId}**, please try again later.`);            }
            /* For now, lets make it so that it doesn't rejoin but just queues the song being played */
    }

    if (player) {
        if (player.state.status == AudioPlayerStatus.Playing || player.state.status == AudioPlayerStatus.Paused || player.state.status == AudioPlayerStatus.AutoPaused) {
                /* 
                    How would I loop exactly?

                    1. Go to the beginning of the song?? is that even a thing
                    2. Just call 'player.play(resource);' again, it will still be there (lol)
                    i be over complicating things too much
            */
            loopActive = false
            return msg.reply("Song has stopped Looping!")
        } else {
            return msg.reply("Nothing is Playing...")
        }
    } else {
        return msg.reply("You haven't played anything yet")
    }
}

function unpauseSong(msg) {

    const voiceChannel = msg.member?.voice?.channel;
    if (!voiceChannel) return msg.reply("Join a voice channel first!");
    
    let connection = getVoiceConnection(msg.guild.id);

    if (connection) {
        if (connection.joinConfig.channelId !== voiceChannel.id) { //Checks to see if bot is in another channel
            return msg.reply(`Currently in **${connection.joinConfig.channelId}**, please try again later.`);            }
            /* For now, lets make it so that it doesn't rejoin but just queues the song being played */
    }

    if (player.state.status === AudioPlayerStatus.Paused) {
        player.unpause();
    }

    
}

function skipSong(msg) {

    const voiceChannel = msg.member?.voice?.channel;
    if (!voiceChannel) return msg.reply("Join a voice channel first!");
    

    let connection = getVoiceConnection(msg.guild.id);

    if (connection) {
        if (connection.joinConfig.channelId !== voiceChannel.id) { //Checks to see if bot is in another channel
            return msg.reply(`Currently in **${connection.joinConfig.channelId}**, please try again later.`);            }
            /* For now, lets make it so that it doesn't rejoin but just queues the song being played */
    } 

    // !play --> if queue is empty : dont play --> else play whatevers already in the queue

    if (player.state.status === AudioPlayerStatus.Playing || player.state.status === AudioPlayerStatus.Paused || player.state.status === AudioPlayerStatus.AutoPaused) {
        const prevSong = playlist.shift();
        if (playlist.length == 0) { 
            return msg.reply("Queue is now empty, Play a Song!");
        }
        else {
        player.stop();

        resource = createAudioResource(playlist[0]);
        player.play(resource);


        if (fs.existsSync(playlist[0])) fs.unlinkSync(prevSong);
        }
    } else {
        return msg.reply("Nothing is playing");
    }
}

async function downloadSongFile(attachment, Dir, fileName) { // Downloads song file to temp folder (does it in background so bot can keep running)
            try {
                // Saves file to local system
                const filePath = path.join(Dir, fileName);
                // console.log(filePath);

                // Fetch the file from discord (since they are saved as urls to discord's cloud system or whavtevr)
                const response = await fetch(attachment.url) // becomes HTTP object, not a boolean
                if (!response.ok) { //Ensures that response is actually accessible
                    throw new Error(`Failed to fetch: **${response.statusText}**`);
                }
                
                const buffer = await response.arrayBuffer();
                fs.writeFileSync(filePath, Buffer.from(buffer));

                console.log(`${fileName} has been downloaded!`);

                return filePath; // Returns the file path so we can use it for our resource function
            } catch (err) {
                console.error("Error downloading file: " + err);
                return null;
            }
    }
//Create function that deletes ALL songs from file


/*
Write Loop Function,


*/

async function cleanupFolder(){
    while (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir);
    }
    if (!fs.existsSync(tempDir)){
        console.log("Folder Deleted");
    }
    // process.exit();
 }
// ----------------------

// This function deletes the folder upon its exit (or whenever it's killed)
process.on('exit', cleanupFolder);

process.on('SIGINT', cleanupFolder);



// CNTRL + C --> closes the bot in the nodemon managaer

// How to secure token (use terminal)
client.login(process.env.TOKEN);


// Organize Main Folder or continue building functionalities in different folders?
// - Continute building functionalities in different folders



