import { NstrumentaClient } from "nstrumenta";
import minimist from "minimist";
import ws from 'ws';
import MapLRU from 'map-lru';

const argv = minimist(process.argv.slice(2));
const wsUrl = argv.wsUrl;
const nstClient = new NstrumentaClient();
let imageMap = new MapLRU(5);

nstClient.addListener("open", () => {
    console.log("websocket opened successfully");
    nstClient.addSubscription('preprocessing', (msg) => {
        imageMap.set(msg.imageTag, msg.data);
    });
    nstClient.addSubscription('alert', (imageTag) => {
        const image = imageMap.get(imageTag);
        nstClient.send('images', image);
        console.log('sent');
    });
})

nstClient.connect({ wsUrl, nodeWebSocket: ws });