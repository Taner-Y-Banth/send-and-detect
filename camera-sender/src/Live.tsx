import { Grid, InputLabel, MenuItem, Select } from '@mui/material';
import Button from '@mui/material/Button';
import { NstrumentaBrowserClient } from 'nstrumenta/dist/browser/client';
import React from 'react';
import { useLocation } from 'react-router-dom';
import Webcam from 'react-webcam';
import { v4 as uuidv4 } from 'uuid';
import './index.css';

const FACING_MODE_USER = 'user';
const FACING_MODE_ENVIRONMENT = 'environment';

const videoConstraints = {
  facingMode: FACING_MODE_USER,
};

type Detection = {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
  label: string;
  score: number;
};

type Occupation = 'empty' | 'present';
let occupation:Occupation = 'empty'

const Camera = () => {
  const [captureInterval, setCaptureInterval] = React.useState<number | string>(
    1
  );
  const webcamRef = React.useRef(null);
  const webcamContainerRef = React.useRef(null);
  const [responseChannel, setResponseChannel] = React.useState(uuidv4());
  const [imgSrc, setImgSrc] = React.useState(null);
  const nstClientRef = React.useRef<NstrumentaBrowserClient>(null);
  const [facingMode, setFacingMode] = React.useState(FACING_MODE_USER);
  const [detections, setDetections] = React.useState<Array<Detection>>([]);
  // const [occupation, setOccupation] = React.useState<Occupation>('empty');

  const capture = React.useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) return;
    setImgSrc(imageSrc);
    const data = imageSrc.split(',')[1];
    nstClientRef.current?.send('preprocessing', { data, responseChannel });
  }, [webcamRef, setImgSrc]);

  React.useEffect(() => {
    if (captureInterval && typeof captureInterval !== 'string') {
      const interval = setInterval(() => {
        capture();
      }, captureInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [captureInterval]);

  const svgScalingWidth = (value) => {
    return `${(100 * value) / webcamContainerRef.current?.offsetWidth}%`;
  };
  const svgScalingHeight = (value) => {
    return `${(100 * value) / webcamContainerRef.current?.offsetHeight}%`;
  };

  const handleClick = React.useCallback(() => {
    setFacingMode((prevState) =>
      prevState === FACING_MODE_USER
        ? FACING_MODE_ENVIRONMENT
        : FACING_MODE_USER
    );
  }, []);

  const { search } = useLocation();

  React.useEffect(() => {
    const wsUrlParam = new URLSearchParams(search).get('wsUrl');
    const wsUrl = wsUrlParam
      ? wsUrlParam
      : window.location.origin.replace('http', 'ws');
    const apiKeyParam = new URLSearchParams(search).get('apiKey');
    if (apiKeyParam) {
      localStorage.setItem('apiKey', apiKeyParam);
    }
    const apiLocalStore = localStorage.getItem('apiKey');
    const apiKey = apiKeyParam ? apiKeyParam : apiLocalStore;
    const discordParam = new URLSearchParams(search).get('discord');
    if (discordParam) {
      localStorage.setItem('discord', discordParam);
    }
    const discordLocalStore = localStorage.getItem('discord');
    const discord = discordParam ? discordParam : discordLocalStore;

    nstClientRef.current = new NstrumentaBrowserClient();

    nstClientRef.current.addListener('open', () => {
      nstClientRef.current.addSubscription(responseChannel, (response) => {
        console.log(response);
        const lines = response.split('\n');
        const newDetections: Array<Detection> = [];
        const resultIndex = lines.findIndex(
          (line) => line == '-------RESULTS--------'
        );
        for (let i = resultIndex + 1; i + 3 < lines.length; i += 4) {
          const score = Number(lines[i + 2].split(':')[1]) * 100;
          const label = `${lines[i]}`;
          const regex = /[0-9]+/g;
          const [xmin, ymin, xmax, ymax] = lines[i + 3]
            .match(regex)
            .map(Number);
          newDetections.push({ score, label, xmin, xmax, ymin, ymax });
        }
        setDetections(newDetections);

        const labels = newDetections.map((detection) => detection.label);

        if (occupation === 'present' && !labels.includes('person')){
          occupation = 'empty'
        }
        if (
          discord === 'true' &&
          labels.includes('person') &&
          occupation === 'empty'
        ) {
          nstClientRef.current.send('alert', { message: 'approaching' });
          occupation = 'present'
        }
      });
    });

    nstClientRef.current.connect({ wsUrl, apiKey });
  }, []);

  return (
    <>
      <div
        style={{
          display: 'grid',
        }}
        ref={webcamContainerRef}
      >
        <Webcam
          width={'100%'}
          audio={false}
          ref={webcamRef}
          style={{
            gridRowStart: 1,
            gridColumnStart: 1,
            zIndex: 1,
          }}
          forceScreenshotSourceSize={false}
          screenshotFormat='image/jpeg'
          videoConstraints={{
            ...videoConstraints,
            facingMode,
          }}
        />
        <svg
          style={{
            width: '100%',
            height: '100%',
            gridRowStart: 1,
            gridColumnStart: 1,
            zIndex: 2,
          }}
        >
          {detections.map((detection) => {
            const { xmin, xmax, ymin, ymax, label, score } = detection;
            return (
              <>
                <rect
                  fill='none'
                  stroke='green'
                  strokeWidth='2px'
                  x={svgScalingWidth(xmin)}
                  y={svgScalingHeight(ymin)}
                  width={svgScalingWidth(xmax - xmin)}
                  height={svgScalingHeight(ymax - ymin)}
                />
                <text
                  x={svgScalingWidth(xmin + 3)}
                  y={svgScalingHeight(ymin + 20)}
                  fill='green'
                >
                  {`${label} ${score.toFixed(0)}`}
                </text>
              </>
            );
          })}
        </svg>
      </div>
      <Grid container spacing={2} direction={'row'}>
        <p></p>
      </Grid>
      <Grid container spacing={2} direction={'row'}>
        <Grid item>
          <InputLabel id='select-label'>Interval</InputLabel>
          <Select
            labelId='select-label'
            id='select'
            value={captureInterval}
            label='Interval'
            onChange={(e) => {
              setCaptureInterval(e.target.value);
            }}
          >
            <MenuItem value='off'>off</MenuItem>
            <MenuItem value={0.5}>0.5s</MenuItem>
            <MenuItem value={1}>1s</MenuItem>
            <MenuItem value={2}>2s</MenuItem>
          </Select>
        </Grid>
        <Grid item>
          <Button color='inherit' variant='outlined' onClick={handleClick}>
            Switch View
          </Button>
        </Grid>
        <Grid item>
          <Button color='inherit' variant='outlined' onClick={capture}>
            Capture photo
          </Button>
        </Grid>
      </Grid>
    </>
  );
};

export default Camera;
