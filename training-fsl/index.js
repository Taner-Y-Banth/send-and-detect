import { randomUUID } from 'crypto';
import { existsSync, mkdirSync, rmdirSync } from 'fs';
import fsPromises from 'fs/promises';
import minimist from 'minimist';
import { NstrumentaClient } from 'nstrumenta';
import ws from 'ws';
import { $ } from 'zx';

const argv = minimist(process.argv.slice(2));
const wsUrl = argv.wsUrl;
const nstClient = new NstrumentaClient();

nstClient.addListener("open", () => {
    nstClient.addSubscription('fsl-folder', async (msg) => {
        
        const msgDir = msg.dir.replace("/", "-").replace(" ", "");
        console.log(msgDir);
        const directory = "./data/" + msgDir;

        if (!existsSync('./data')) {
            mkdirSync('data', () => { });
        }
        if (!existsSync(directory)) {
            mkdirSync(directory, () => { });
            console.log('directory created!');
        }

        const buff = Uint8Array.from(atob(msg.data), (c) => c.charCodeAt(0))
        const filename = `${directory}/${randomUUID()}.jpeg`
        await fsPromises.writeFile(filename, buff);
        console.log("file written", filename);
    });

    nstClient.addSubscription('retrain', async (msg) => {
        try {
            await $`python3 imprinting_learning.py --model model/mobilenet_v1_1.0_224_l2norm_quant_edgetpu.tflite --data data/ --output /home/mendel/retrained_imprinting_model.tflite`

            const model = await fsPromises.readFile('/home/mendel/retrained_imprinting_model.tflite');
            const label = await fsPromises.readFile('/home/mendel/retrained_imprinting_model.txt');

            nstClient.send('imprint', 'train-comp');

            const rngNum = randomUUID();

            nstClient.storage.upload({
                filename: `${rngNum}.tflite`,
                data: model,
                meta: {tags: ['model']},
              });
            nstClient.storage.upload({
                filename: `${rngNum}.txt`,
                data: label,
                meta: {tags: ['label']},
              });

            console.log('training completed');
        } catch (err) {
            console.error(err);
        };
    });

    nstClient.addSubscription('reset', (msg) => {
        rmdirSync('data', { recursive: true, force: true });
    });
})

console.log("nstrumenta connect");

nstClient.connect({ wsUrl, nodeWebSocket: ws });