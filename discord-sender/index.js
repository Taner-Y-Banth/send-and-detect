import { Client as DiscordClient, Intents, MessageAttachment } from 'discord.js';
import fsPromises from 'fs/promises';
import minimist from 'minimist';
import { NstrumentaClient } from 'nstrumenta';
import ws from 'ws';

const argv = minimist(process.argv.slice(2));
const wsUrl = argv.wsUrl;
const nstClient = new NstrumentaClient();
const token = argv.token

const client = new DiscordClient({ intents: [Intents.FLAGS.GUILDS] });

nstClient.addListener("open", () => {
    console.log("websocket opened successfully");
    client.login(token)
    nstClient.addSubscription('images', async (image) => {
        console.log('received');
        const buff = Uint8Array.from(atob(image), (c) => c.charCodeAt(0))
        const filename = `${Date.now()}.jpeg`
        await fsPromises.writeFile(filename, buff);
        const file = new MessageAttachment(filename);
        const channel = client.channels.cache.get('970144599098146826');
        await channel.send(`***APPROACHING*** \n <@713764004383686666>`, {files:[file]});
        await fsPromises.rm(filename);
    });
});

nstClient.connect({ wsUrl, nodeWebSocket: ws });