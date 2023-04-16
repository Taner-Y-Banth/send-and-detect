import { Box, Button, Stack, Typography } from '@mui/material';
import { MediaInfo, SubscriberType } from 'nstrumenta/dist/browser/client';
import { FC, useContext, useEffect, useRef, useState } from 'react';
import { ClientContext } from '../..';

export const RemoteMedia: FC<{ info: MediaInfo }> = ({ info }) => {
  const [stream, setStream] = useState<MediaStream>();
  const [data, setData] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const client = useContext(ClientContext);

  useEffect(() => {
    client.webrtcClient.events.onTrack.subscribe((stream, { mediaId }) => {
      if (mediaId !== info.mediaId) return;
      //@ts-ignore
      videoRef.current!.srcObject = stream;

      //@ts-ignore
      setStream(stream);
    });
    client.webrtcClient.events.onUnsubscribe.subscribe(({ mediaId }) => {
      if (mediaId !== info.mediaId) return;
      setStream(undefined);
    });
  }, []);

  const changeQuality = (info: MediaInfo, type: SubscriberType) => {
    client.webrtcClient.changeQuality(info, type);
  };

  const subscribe = async () => {
    await client.webrtcClient.subscribe([info]);
    client.webrtcClient.sfu.getConsumer(info.mediaId).onMessage.subscribe((data) => setData(data));
  };

  return (
    <Box padding={1}>
      {Object.entries(info).map(([k, v]) => (
        <Typography key={k}>
          {k} : {v.toString()}
        </Typography>
      ))}
      <Stack direction="row" p={1}>
        <Button onClick={subscribe} disabled={!!stream}>
          subscribe
        </Button>
        <Button onClick={() => client.webrtcClient.unsubscribe(info)} disabled={!stream}>
          unsubscribe
        </Button>
      </Stack>
      {stream && info.simulcast && (
        <Stack direction="row" p={1}>
          <Button onClick={() => changeQuality(info, 'low')}>low</Button>
          <Button onClick={() => changeQuality(info, 'high')}>high</Button>
          <Button onClick={() => changeQuality(info, 'auto')}>auto</Button>
        </Stack>
      )}
      {info.kind !== 'application' ? (
        <video
          ref={videoRef}
          autoPlay
          style={{
            background: 'black',
            maxWidth: 400,
            height: stream ? 'auto' : 0,
          }}
        />
      ) : (
        <Box>
          <Typography>{data}</Typography>
        </Box>
      )}
    </Box>
  );
};
