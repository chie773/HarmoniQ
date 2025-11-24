import path from 'path';
import { MusicCommands } from '../src/commands/music';

// Minimal fake player manager implementing the methods used by MusicCommands
class FakePlayerManager {
    private idle = true;
    getPlayer() { return {}; }
    isIdle() { return this.idle; }
    play(connection: any, guildId: string) { console.log('FakePlayerManager.play called for guild', guildId); this.idle = false; }
    pause() { console.log('FakePlayerManager.pause'); return true; }
    unpause() { console.log('FakePlayerManager.unpause'); return true; }
    getStatus() { return 1; }
    skip() { console.log('FakePlayerManager.skip'); }
    setLoop(v: boolean) { console.log('FakePlayerManager.setLoop', v); }
}

// Minimal fake queue used by MusicCommands
class FakeQueue {
    private items: Array<{ filePath: string; downloaded: boolean }> = [];
    isFull() { return this.items.length >= 5; }
    add(filePath: string, downloaded: boolean) { this.items.push({ filePath, downloaded }); console.log('FakeQueue.add', filePath, downloaded); }
    isEmpty() { return this.items.length === 0; }
}

const tempDir = path.join(__dirname, '..', 'temp');
const playerManager = new FakePlayerManager();
const queue = new FakeQueue();
const music = new MusicCommands(playerManager as any, queue as any, tempDir);

const fakeMsg = {
    reply: (txt: any) => console.log('reply:', txt),
    attachments: { first: () => undefined },
    guild: { id: 'demo-guild' }
} as any;

(async () => {
    console.log('--- Demo: add first file (should trigger play) ---');
    await (music as any).addToQueueAndPlay(fakeMsg, path.join(tempDir, 'song1.mp3'), {} as any, false);

    console.log('\n--- Demo: add second file (should be queued) ---');
    await (music as any).addToQueueAndPlay(fakeMsg, path.join(tempDir, 'song2.mp3'), {} as any, false);

    console.log('\n--- Demo finished ---');
})();
