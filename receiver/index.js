import minimist from 'minimist';
import { NstrumentaClient } from 'nstrumenta';
import ws from 'ws';
import { $ } from 'zx';

const argv = minimist(process.argv.slice(2));
const wsUrl = argv.wsUrl;
const personalMac = argv.personalMac
const altMac = argv.altMac
const nstClient = new NstrumentaClient();

nstClient.addListener("open", () => {

    console.log("websocket opened successfully");

    nstClient.addSubscription('packets', (mac) => {
        $`wakeonlan ${mac}`
    });
    nstClient.addSubscription('personal', (message) => {
        if (message == 'personal') {
            $`wakeonlan ${personalMac}`
        };
    });
    nstClient.addSubscription('altpc', (message) => {
        if (message == 'altpc') {
            $`wakeonlan ${altMac}`
        }
    });
});

nstClient.connect({ wsUrl, nodeWebSocket: ws });