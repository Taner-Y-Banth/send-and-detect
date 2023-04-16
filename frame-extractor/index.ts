import minimist from "minimist";
import { NstrumentaClient } from "nstrumenta";
import { readFile } from "fs/promises";
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";

const argv = minimist(process.argv.slice(2));
const wsUrl: string = argv.wsUrl;
const input: string = argv.input;
const nstClient = new NstrumentaClient();

const loadInput = async (input: string) => {
  const ffmpeg = createFFmpeg({ log: true });
  await ffmpeg.load();
  ffmpeg.FS("writeFile", input, await fetchFile(input));
  await ffmpeg.run("-i", input);
};
loadInput(input);

nstClient.addListener("open", async () => {
  console.log("nstrumenta open");
  // const list = (await nstClient.storage.list("data")) as any;
  // const mp4s = list.filter((file) => file.data.name.endsWith(".jpeg"));
  // console.log(mp4s);
  // nstClient.storage.download(mp4s[0].data.filePath);
});

console.log("nstrumenta connect");
nstClient.connect({ wsUrl });
