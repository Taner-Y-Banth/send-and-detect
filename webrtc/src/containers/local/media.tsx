import { Box, Button, Typography } from '@mui/material';
import { MediaInfo } from 'nstrumenta/dist/browser/client';
import { FC, useContext } from 'react';
import { ClientContext } from '../..';

export const LocalMedia: FC<{ info: MediaInfo }> = ({ info }) => {
  const client = useContext(ClientContext);

  return (
    <Box padding={1}>
      {Object.entries(info).map(([k, v]) => (
        <Typography key={k}>
          {k} : {v.toString()}
        </Typography>
      ))}
      <Button onClick={() => client.webrtcClient.unPublish(info)}>un publish</Button>
    </Box>
  );
};
