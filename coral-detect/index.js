import fsPromises from 'fs/promises';
import minimist from 'minimist';
import { NstrumentaClient } from 'nstrumenta';
import ws from 'ws';
import { $ } from 'zx';

const argv = minimist(process.argv.slice(2));
const wsUrl = argv.wsUrl;
const nstClient = new NstrumentaClient();

nstClient.addListener("open", () => {

    console.log("websocket opened successfully");

    nstClient.addSubscription('preprocessing', async (msg) => {
        try {
            const buff = Uint8Array.from(atob(msg.data), (c) => c.charCodeAt(0))
            const filename = `-i ${msg.responseChannel}${Date.now()}.jpeg`
            await fsPromises.writeFile(filename, buff);
            const thresholdArg = argv.threshold ? '-t ' + argv.threshold : ""
            const countArg = argv.count ? '-c ' + argv.count : ""
            const modelArg = argv.model ? '-m ' + argv.model : ""
            const labelArg = argv.label ? '-l ' + argv.label : ""
            const command = [filename,
                countArg,
                thresholdArg,
                modelArg,
                labelArg
            ]
            console.log(command)
            const { stdout } = await $`python3 detect_image.py ${command}`
            await fsPromises.rm(filename)
            const imageTag = msg.imageTag
            nstClient.send(
                msg.responseChannel, {
                imageTag,
                stdout,
            });
        } catch (err) {
            console.error(err);
        };
    });
});

nstClient.addListener("open", () => {
    console.log("websocket opened successfully");
});

console.log("nstrumenta connect");

nstClient.connect({ wsUrl, nodeWebSocket: ws });