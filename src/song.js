// What do i need to import to this class?
/* 
    File reading/writing capabilities --> Download feature
    Audio resource creation --> Easy audio resource creation



*/

const { AudioResource, createAudioResource, StreamType } = require("@discordjs/voice");
const path = require('path');
const fs = require('fs');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

class Song {
    constructor(mp3_filepath, title) {
        this.mp3_filepath = mp3_filepath;
        this.title = title; // "local", "youtube", etc.
        
        
    }



// export function songType(song) {
    
// }


}

    // To export multiple functions, I must create an export object, with each function
module.exports = {Song};
    /* Need to export 
        --> CreateSong
    */

// function CreateSong (attachment) {

// }


