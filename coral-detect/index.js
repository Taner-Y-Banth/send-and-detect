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
            const filename = `${msg.responseChannel}${Date.now()}.jpeg`
            await fsPromises.writeFile(filename, buff);

            const { stdout } = await $`python3 detect_image.py -m ./test_data/ssd_mobilenet_v2_coco_quant_postprocess_edgetpu.tflite -l ./test_data/coco_labels.txt -i ${filename}`
            await fsPromises.rm(filename)
            nstClient.send(
                msg.responseChannel,
                stdout
            );
        } catch (err) {
            console.error(err)
        };
    });
});

nstClient.addListener("open", () => {
    console.log("websocket opened successfully");
});

console.log("nstrumenta connect");

nstClient.connect({ wsUrl, nodeWebSocket: ws });