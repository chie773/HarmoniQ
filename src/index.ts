import dotenv from 'dotenv';
dotenv.config();

import { Client, GatewayIntentBits } from 'discord.js';
import { getVoiceConnection } from '@discordjs/voice';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { Queue } from './audio/queue.ts';
import { AudioPlayerManager } from './audio/player.ts';
import { CommandRouter } from './commands/index.ts';
import { Manager } from 'moonlink.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
}

const queue = new Queue();
queue.loadFromDirectory(tempDir);

const playerManager = new AudioPlayerManager(queue);

const commandRouter = new CommandRouter(playerManager, queue, tempDir);

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
    ],
});

declare module 'discord.js' {
    interface Client {
        manager: Manager;
    }
}

client.manager = new Manager({
    nodes:[
        {
            host: 'localhost',
            port: 8080,
            password: 'youshallnotpass',
            secure: false,
        },
    ],
    options: {} as any,
    sendPayload: (guildId: string, payload: string) => {
        const guild = client.guilds.cache.get(guildId);
        if (guild) guild.shard.send(JSON.parse(payload));
    },
});




client.on('ready', (c) => {
    console.log(`${c.user.displayName} is online!`);
    client.manager.init(c.user.id);
});

client.on('messageCreate', async (msg) => {
    await commandRouter.route(msg);
});

client.on('raw', (packet) => {
  client.manager.packetUpdate(packet);
});



// Handle node events
client.manager.on('nodeConnected', (node) => console.log(`Node ${node.identifier} connected!`));
client.manager.on('nodeError', (node, error) => console.error(`Node ${node.identifier} error:`, error));


async function cleanup() {
    if (client.isReady()) {
        for (const [guildId, guild] of client.guilds.cache) {
            const connection = getVoiceConnection(guildId);
            if (connection) {
                try {
                    connection.destroy();
                    console.log(`Disconnected from voice channel in ${guild.name}`);
                } catch (err) {
                    console.error(`Error disconnecting from ${guild.name}:`, err);
                }
            }
        }
    }


    playerManager.getPlayer().stop();


    queue.clear();
    if (fs.existsSync(tempDir)) {
        try {
            fs.rmSync(tempDir, { recursive: true, force: true });
            console.log('Temp folder deleted');
        } catch (err) {
            console.error('Error deleting temp folder:', err);
        }
    }
}


process.on('exit', () => {
    cleanup().catch(console.error);
});
process.on('SIGINT', async () => {
    await cleanup();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    await cleanup();
    process.exit(0);
});


if (!process.env.DISCORD_TOKEN) {
    console.error('ERROR: DISCORD_TOKEN environment variable is not set!');
    process.exit(1);
}

if (!process.env.YT_API_KEY) {
    console.error('ERROR: YT_API_KEY environment variable is not set!');
    process.exit(1);
}

export { client };

console.log("HarmoniQ Server Starting...");

client.login(process.env.DISCORD_TOKEN).catch((err) => {
    console.error('Failed to login:', err);
    process.exit(1);
});
