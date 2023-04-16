import { useContext, useEffect, useState } from 'react';
import { ClientContext } from '.';
import { Box, Stack } from '@mui/material';
import { Control } from './containers/control';
import { LocalMedias } from './containers/local/medias';
import { RemoteMedias } from './containers/remote/medias';

function App() {
  const client = useContext(ClientContext);
  const [peerId, setPeerId] = useState('');

  const init = async () => {
    await client.connect();
    const { offer, peerId } = await client.joinWebRTC('room');
    setPeerId(peerId);
    const { answer, candidates, user } = await client.webrtcClient!.join(peerId, offer);
    client.answerWebRTC(peerId, 'room', answer);
    candidates.forEach((candidate) => client.candidateWebRTC(peerId, 'room', candidate));
  };

  useEffect(() => {
    init();
  }, []);

  return (
    <Box>
      <span>peerId : {peerId}</span>
      <Stack p={2}>
        <Control />
        <LocalMedias />
        <RemoteMedias />
      </Stack>
    </Box>
  );
}

export default App;
