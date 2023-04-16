import { Badge, Box } from '@mui/material';
import { MediaInfo } from 'nstrumenta/dist/browser/client';
import { FC, useContext, useEffect, useState } from 'react';
import { ClientContext } from '../..';
import { LocalMedia } from './media';

export const LocalMedias: FC = () => {
  const client = useContext(ClientContext);
  const [published, setPublished] = useState<MediaInfo[]>([]);

  useEffect(() => {
    client.webrtcClient.events.onPublish.subscribe(() => {
      setPublished(client.webrtcClient.user!.published);
    });
    client.webrtcClient.events.onUnPublish.subscribe(() => {
      setPublished(client.webrtcClient.user!.published);
    });
  }, []);

  return (
    <Box>
      <Badge>published</Badge>
      {published.map((info) => (
        <LocalMedia info={info} key={info.mediaId} />
      ))}
    </Box>
  );
};
