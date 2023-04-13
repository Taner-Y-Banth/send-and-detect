import { Blob } from "buffer";
import { randomUUID } from "crypto";
import { writeFile } from "fs/promises";
import minimist from "minimist";
import { NstrumentaClient } from "nstrumenta";

const argv = minimist(process.argv.slice(2));
const wsUrl: string = argv.wsUrl;
const nstClient = new NstrumentaClient();

nstClient.addListener("open", () => {
  nstClient.addSubscription("models", async (msg) => {
    const buffModel = Uint8Array.from(atob(msg.model), (c) => c.charCodeAt(0));
    const buffLabel = Uint8Array.from(atob(msg.label), (c) => c.charCodeAt(0));

    let filename = `${randomUUID()}.tflite`;

    await writeFile(filename, buffModel);
    console.log("file written", filename);

    await nstClient.storage.upload({
      filename,
      data: buffModel as unknown as Blob,
      meta: {tag: 'model'},
    });

    filename = `${randomUUID()}.tflite`;
    await writeFile(filename, buffLabel);
    console.log("file written", filename);

    await nstClient.storage.upload({
      filename,
      data: buffModel as unknown as Blob,
      meta: {tag: 'model'},
    });
  });
});

console.log("nstrumenta connect");
nstClient.connect({ wsUrl });
