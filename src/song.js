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

    audio = AudioResource;
    mp3_filepath = '';
    url = '';
    title = '';

}


// export function songType(song) {
    
// }



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

module.exports = downloadSongFile;

