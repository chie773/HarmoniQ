import { google } from 'googleapis';

function getYouTubeClient() {
    const apiKey = process.env.YT_API_KEY;
    if (!apiKey) {
        throw new Error('YT_API_KEY is not set in environment variables');
    }
    return google.youtube({
        version: 'v3',
        auth: apiKey
    });
}

export function isYouTubePlaylistUrl(url: string): boolean {
    try {
        const urlObj = new URL(url);
        return (
            (urlObj.hostname.includes('youtube.com') && urlObj.searchParams.has('list')) ||
            (urlObj.hostname.includes('youtu.be') && urlObj.searchParams.has('list'))
        );
    } catch {
        return false;
    }
}

export function extractPlaylistId(url: string): string | null {
    try {
        const urlObj = new URL(url);
        return urlObj.searchParams.get('list');
    } catch {
        return null;
    }
}

export async function getPlaylistVideoTitles(playlistId: string): Promise<string[]> {
    try {
        const youtube = getYouTubeClient();
        const response = await youtube.playlistItems.list({
            part: ['snippet'],
            playlistId: playlistId,
            maxResults: 50,
        });

        if (!response.data.items) {
            return [];
        }

        const titles = response.data.items
            .map(item => item.snippet?.title)
            .filter((title): title is string => Boolean(title));

        return titles;
    } catch (error) {
        console.error('Error fetching playlist videos:', error);
        throw error;
    }
}
