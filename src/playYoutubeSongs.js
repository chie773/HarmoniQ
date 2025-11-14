// Where i'll store all the commands for the bot


// Next command, creating a playlist queue
// How do i even make this?
// Ways to create a playlist queue
/* Create a file that holds the paths of all the downloaded files,
    then parse file for the next song
    Pros: Is there even a pro to this? LOL 
        -- Simple file storage, easy to manage?
    Cons:
        -- Takes up a bunch of file space
        -- Wouldnt be good for porting (you don't want to constantly
                                        download things to a host pc)
                                        

    Use an external host website to manage song requests
    Pros: 
        -- Minimizes load of pc, keeps things online based
    Cons:
        -- Might negate file upload feature (may need way to download files
                                            to the website)
    
    
    Store the names of the songs within an array and based on the request
    do the approriate action (file == download and play,
                                yt link == play from youtube,
                                just song name == search and play)
    Pros: 
        -- removes need for external website or extra files in order to store
        data // dynamic storage (just pop the song from arrayQueue once playing)
    Cons: 
        -- Discord bot message search functionalities are very limited
        -- May have to build searching capabilities

*/

// Before all this, lets make the bot able to play youtube links
// const { AudioResource, createAudioResource, createAudioPlayer, StreamType } = require("@discordjs/voice");
// const Youtube = require('youtube-sr').default; 


// async function run() {
//     const video = await Youtube.searchOne('herohunterxdd silksong is easy')
//     console.log(video.url)
//     console.log(video.title)
//     console.log(video.url)
// } 

// const song = createAudioResource()


