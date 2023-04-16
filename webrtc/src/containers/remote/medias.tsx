import { Badge, Box } from '@mui/material';
import { MediaInfo } from 'nstrumenta/dist/browser/client';
import { FC, useContext, useEffect, useState } from 'react';
import { ClientContext } from '../..';
import { RemoteMedia } from './media';

export const RemoteMedias: FC = () => {
  const [medias, setMedias] = useState<MediaInfo[]>([]);

  const client = useContext(ClientContext);

  const updateMedias = async () => {
    const medias = await client.webrtcClient.getMedias();
    console.log('updateMedias', medias);
    setMedias(medias);
  };

  useEffect(() => {
    client.webrtcClient.events.onConnect.subscribe(updateMedias);
    client.webrtcClient.events.onPublish.subscribe(updateMedias);
    client.webrtcClient.events.onUnPublish.subscribe(updateMedias);
  }, []);

  return (
    <Box>
      <Badge>medias</Badge>
      {medias.map((info) => (
        <RemoteMedia info={info} key={info.mediaId} />
      ))}
    </Box>
  );
};
