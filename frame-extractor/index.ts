import minimist from "minimist";
import { NstrumentaClient } from "nstrumenta";
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from 'path'

const argv = minimist(process.argv.slice(2));
const wsUrl: string = argv.wsUrl;
const input: string = argv.input;
const nstClient = new NstrumentaClient();

const loadInput = async (input: string) => {
  let duration = 0;
  const ffmpeg = createFFmpeg({
    log: true,
  });
  //parse the logger messages to extract the duration
  ffmpeg.setLogger((message) => {
    console.log('logger!', message)
    const regex = /Duration: (\d{2})\:(\d{2})\:(\d{2})\.(\d{2})/gm;
    const matches = regex.exec(String(message.message));
    if (matches != null) {
      const h = Number(matches[1]);
      const m = Number(matches[2]);
      const s = Number(matches[3]);
      // const ms = Number(matches[4]);
      duration = h * 3600 + m * 60 + s;
    }
  },)

  await ffmpeg.load();

  console.log(input);
  const { name, dir, base: infileName } = path.parse(input);
  console.log(`extracting frames from ${infileName}`)

  ffmpeg.FS("writeFile", infileName, await fetchFile(input));
  //run once just to get duration
  await ffmpeg.run("-i", infileName);
  console.log({ duration });
  mkdir('out', { recursive: true });
  for (let ss = 0; ss < duration; ss += 1) {
    const ssDisplayNumber = `${ss*1000}`.padStart(9, '0');
    const outFileName = `./out/outframe${ssDisplayNumber}.jpeg`
    await ffmpeg.run("-ss", `${ss}`, "-i", infileName, "outframe.jpeg");
    await writeFile(outFileName, ffmpeg.FS("readFile", "outframe.jpeg"));
  
    //TODO:
    // here you can use the image in outFileName to call vision api


  };
}
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
