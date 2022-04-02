import fsPromises from 'fs/promises';
import Jimp from 'jimp';
import minimist from 'minimist';
import fs from 'fs';
import { NstrumentaClient } from 'nstrumenta';
import ws from 'ws';
import { $ } from 'zx';

const argv = minimist(process.argv.slice(2));
const wsUrl = argv.wsUrl;
const nstClient = new NstrumentaClient();
const completed = [];

let timeoutID = undefined

fs.watch('/home/mendel/images', (eventType, filename) => {
    console.log(`event type is: ${eventType}`, filename, completed);
    if (eventType == 'change' && !completed.includes(filename)) {
  
      if (timeoutID) {
        clearTimeout(timeoutID);
      }
  
      timeoutID = setTimeout( async () => {
        completed.push(filename);
        console.log(`filename provided: ${filename}`);
        const buff = await fsPromises.readFile(`/home/mendel/images/${filename}`);
        nstClient.sendBuffer('postprocessing', buff);
        console.log('nstClient Sent Buffer')
        fs.rmSync(`/home/mendel/images/${filename}`)
      }, 400)
    }
  }),

nstClient.addListener("open", () => {

    console.log("websocket opened successfully");

    nstClient.addSubscription('preprocessing', async (buff) => {

        await fsPromises.writeFile('infileone.png', buff);

        Jimp.read("infileone.png", async (err, image) => {

            if (err) {
                throw new Error(err);
            }
            // setting colorType(2) forces the png to RGB (no alpha)
            // the python reshape fails with RGBA images 
            image.colorType(2).write("infile.png");
            const {stdout} = await $`python3 detect_image.py -m ./test_data/ssd_mobilenet_v2_coco_quant_postprocess_edgetpu.tflite -l ./test_data/coco_labels.txt -i infile.png -o /home/mendel/images/${Date.now()}.png`
            nstClient.send(
                'visionText',
                stdout
            );
        });
    });
});

nstClient.addListener("open", () => {
    console.log("websocket opened successfully");
});

console.log("nstrumenta connect");

nstClient.connect({ wsUrl, nodeWebSocket: ws });