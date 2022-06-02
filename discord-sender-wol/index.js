import minimist from 'minimist';
import { NstrumentaClient } from 'nstrumenta';
import ws from 'ws';
import Discord from 'discord.js';

const argv = minimist(process.argv.slice(2));
const wsUrl = argv.wsUrl;
const nstClient = new NstrumentaClient();
const token = argv.token

const prefix = '-'
const bot = new Discord.Client();

bot.login(token);

bot.on('message', async (msg) => {
    //if our message doesnt start with our defined prefix, dont go any further into function
    if (!msg.content.startsWith(prefix)) {
        return
    };

    //slices off prefix from our message, then trims extra whitespace, then returns our array of words from the message
    const args = msg.content.slice(prefix.length).trim().split(' ');

    //splits off the first word from the array, which will be our command
    const command = args.shift().toLowerCase();

    if (command === 'personal') {
        msg.reply('https://www.youtube.com/watch?v=miZHa7ZC6Z0');
        nstClient.send('personal', 'personal');
    };
    if (command === 'altpc') {
        msg.reply('https://www.youtube.com/watch?v=e_DqV1xdf-Y');
        nstClient.send('altpc', 'altpc');
    };
});

nstClient.connect({ wsUrl, nodeWebSocket: ws });