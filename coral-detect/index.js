import fsPromises from 'fs/promises';
import Jimp from 'jimp';
import minimist from 'minimist';
import { NstrumentaClient } from 'nstrumenta';
import ws from 'ws';
import { $ } from 'zx';

const argv = minimist(process.argv.slice(2));
const wsUrl = argv.wsUrl;
const nstClient = new NstrumentaClient();

nstClient.addListener("open", () => {

    console.log("websocket opened successfully");

    nstClient.addSubscription('preprocessing', async (buff) => {
        try {
            const filename = `${Date.now()}.png`
            const noAlpha = `${Date.now()}.1.png`
            await fsPromises.writeFile(filename, buff);

            Jimp.read(filename, async (err, image) => {

                // setting colorType(2) forces the png to RGB (no alpha)
                // the python reshape fails with RGBA images

                image.colorType(2).write(noAlpha);
                const { stdout } = await $`python3 detect_image.py -m ./test_data/ssd_mobilenet_v2_coco_quant_postprocess_edgetpu.tflite -l ./test_data/coco_labels.txt -i ${noAlpha}`
                await fsPromises.rm(filename)
                await fsPromises.rm(noAlpha)
                nstClient.send(
                    'visionText',
                    stdout
                );
            });
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