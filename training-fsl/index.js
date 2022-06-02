import minimist from 'minimist';
import { NstrumentaClient } from 'nstrumenta';
import { $ } from 'zx';

const argv = minimist(process.argv.slice(2));
const wsUrl = argv.wsUrl;
const nstClient = new NstrumentaClient();

nstClient.addListener("open", () => {
    nstClient.addSubscription('retrain', async (msg) => {
        const { stdout } = await $`python3 imprinting_learning.py `
        nstClient.send('imprint', stdout);
    });
})

console.log("nstrumenta connect");

nstClient.connect({ wsUrl, nodeWebSocket: ws });