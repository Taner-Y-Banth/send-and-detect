import minimist from 'minimist';
import { NstrumentaClient } from 'nstrumenta';
import ws from 'ws';
import { Client as DiscordClient, Intents } from 'discord.js';

const argv = minimist(process.argv.slice(2));
const wsUrl = argv.wsUrl;
const nstClient = new NstrumentaClient();
const token = argv.token

const client = new DiscordClient({ intents: [Intents.FLAGS.GUILDS] });

nstClient.addListener("open", () => {
    console.log("websocket opened successfully");
    client.login(token)
    nstClient.addSubscription('alert', (imageTag) => {
        console.log(imageTag);
        const channel = client.channels.cache.get('970144599098146826');
        channel.send(`***APPROACHING*** \n <@713764004383686666> \n ${imageTag}`);
    });
});

nstClient.connect({ wsUrl, nodeWebSocket: ws });