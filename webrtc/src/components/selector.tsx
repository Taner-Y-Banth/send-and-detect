import { Button, Stack } from '@mui/material';
import { FC, useState } from 'react';

export const Selector: FC<{
  button: string;
  onClick: () => void;
}> = ({ button, onClick }) => {
  return (
    <Stack direction="row" padding={1}>
      <Button onClick={onClick}>{button}</Button>
    </Stack>
  );
};
