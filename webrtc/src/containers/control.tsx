import { Button, Stack } from '@mui/material';
import { Kind } from 'nstrumenta/dist/browser/client';
import { FC, useContext, useRef, useState } from 'react';
import { ClientContext } from '..';
import { Selector } from '../components/selector';

export const Control: FC = () => {
  const client = useContext(ClientContext);
  const canvasRef = useRef<HTMLCanvasElement>();
  const [intervalTimer, setIntervalTimer] = useState<ReturnType<typeof setTimeout>>();
  const [logName, setLogName] = useState('');
  const publishTestCanvas = async () => {
    const canvas = canvasRef.current;
    const [track] = canvas.captureStream().getTracks();

    if (intervalTimer) {
      clearInterval(intervalTimer);
    }
    setIntervalTimer(
      setInterval(() => {
        //make image with canvas
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20pt Menlo';
        ctx.fillText(`${client.webrtcClient.peerId}`, canvas.width / 2, 0.5 * (canvas.height / 2));
        ctx.fillText(`image:${Date.now()}`, canvas.width / 2, canvas.height / 2);
        ctx.fill();
      }, 16)
    );

    await client.webrtcClient.publish({ track, kind: track.kind as Kind });
  };

  const startRecording = async () => {
    const logName = `${Date.now()}`;
    setLogName(logName);
    client.startRecording(logName, []);
  };

  const stopRecording = async () => {
    client.stopRecording(logName);
  }

  const publishMedia = async (constraints: MediaStreamConstraints) => {
    const [track] = (await navigator.mediaDevices.getUserMedia(constraints)).getTracks();
    await client.webrtcClient.publish({ track, kind: track.kind as Kind });
  };

  const publishDisplay = async () => {
    const [track] = (await (navigator.mediaDevices as any).getDisplayMedia()).getTracks();
    await client.webrtcClient.publish({ track, simulcast: false, kind: track.kind as Kind });
  };

  const publishDataChannel = async () => {
    await client.webrtcClient.publish({ kind: 'application' });
  };

  return (
    <div>
      <Stack direction="row" flexWrap="wrap">
        <Selector button="publish camera" onClick={() => publishMedia({ video: true })} />
        <Selector button="publish display" onClick={() => publishDisplay()} />
        <Button onClick={() => publishMedia({ audio: true })}>publish audio</Button>
        <Button onClick={publishDataChannel}>publish datachannel</Button>
      </Stack>
      <Stack direction="row" flexWrap="wrap">        
        <Selector button="publish test canvas" onClick={() => publishTestCanvas()} />
        <canvas ref={canvasRef} width={640} height={480} style={{ display: 'none' }} />
      </Stack>
      <Stack direction="row" flexWrap="wrap">
        <Selector button="start nstrumenta recording" onClick={() => startRecording()} />
      </Stack>
      <Stack direction="row" flexWrap="wrap">
        <Selector button="stop nstrumenta recording" onClick={() => stopRecording()} />
      </Stack>
    </div>
  );
};
