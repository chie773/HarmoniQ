const playlist = []



/*
    How do i go about creating a playlists for the song?

    1. I can export a function that writes the names of the songs in a file, 
    then parse through the file in order to play the next song (Play Song on next line until file is empty())

        Issues:
            - This can work easily with files already downloaded from the user.
            However, this brings up the problem of how do I queue links.

    2. A hashmap of song objects (Create song class) 
        - Key, Value pairs (song-name: keys, either url or filepath for value)
            - Allows me to remove songs from queue at any position
            - Fast lookups (dont have to parse through an entire file)


        - can't use a hashmap cuz I can't append to front of list
    
    3. A list of song objects (Create song class)
        - Allows me to iterate through objects and pull information needed
            (if url, pull url and play; if mp3, pull file from documents and play) 
       
        - Can destroy element at front of list, can't delete at select location
         (must iterate through entire array to search for element I want to delete)

    
    We'll implement number 3

    song class{ 
        title:
        url:
        mp3_path:
    }

    * Download file function will go here  
    export downloadSong(attachment) --> This is for mp3s
    export createSongFromUrl(url) --> for urls

    **will optimize later**


    idk if the song class needs anything else?

    song_queue = [] ---> just a regular array of song objects

    *import needed imports (just file reading and junk)
     -- will probably move the song downloading features to its 
        own separate file

    ** on command call (!queue)
    export add_to_playlist(SongObject) {
        song_queue.append() # Handle duplicates inside main interaction loop
    }

    // if user wants to see what songs are in the playlist
        (!checkQueue)

    export playlist_songs(){
        r_string = "These are the current songs in the queue:"

        for queued_song in song_queue:
            r_string += "\n " + queued_song

        return r_string; --> returns all the songs in the queue

    }

    export inPlaylist(SongObject) {
        for item (should be a SongObject) in song_queue{
            if song == item --> can't compare objects straight up (they compare reference pointnts)
            if JSON.stringify(song) === JSON.stringify(item) --> compares order of items in object,
                                                                    this works since the order will 
                                                                    remain the same (only takes song objects)
                return True

        
        return False
        }
    }

    (!dequeue)
    export removeFromPlaylist(SongObject){
        # we assume its a valid songobject before it reaches the function

        for i in range(len(SongObject))
         
        //Look down//

    }

    # writing in java cuz i feelz likez it
    public String removeFromPlaylist(SongObject song) {

        for (int i = 0; i < song_queue.length; i++) {
            if (song.equals(song_queue[i])) {
                // Assuming song_queue is an arraylist

                removed_song = song_queue.remove(i);
            }

            ? How will I get the Song object if user only provides title
            -- Create a search function that allows you to search in queue
               -> !!! User will have to copy exact title (using !checkQueue) 
        }

        return removed_song;
        // Allows bot to print that song was removed
    }

    ? what to do next?
    1. Create looping feature then come back to playlist function
    2. Create playlist function then create looping feature later

    Flip a coin
    picked 1 (2x)

    So we gonna create the search feature, 
        thennnnn we gon create the loop function

    
    function search(title) {
    ? Do I wanna search based of the title or based off the object
     - honestly, I only need this if the user just gives a title
        let song;

        for item in song_queue: --> python loop in js function rofl
            if item.getTitle() == title:
                song = item
                break; --> no need to run it longer once found
        
        return item
    }
    
    ok function done we go make loopy loop feature now








    







            






*/