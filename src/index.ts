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

client.on('ready', (c) => {
    console.log(`${c.user.displayName} is online.`);
});

client.on('messageCreate', async (msg) => {
    await commandRouter.route(msg);
});

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


if (!process.env.TOKEN) {
    console.error('ERROR: TOKEN environment variable is not set!');
    process.exit(1);
}

client.login(process.env.TOKEN).catch((err) => {
    console.error('Failed to login:', err);
    process.exit(1);
});
