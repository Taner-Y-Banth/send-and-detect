import {
  Grid,
  Input,
  InputLabel,
  MenuItem,
  Select,
  Switch,
} from "@mui/material";
import Button from "@mui/material/Button";
import { NstrumentaBrowserClient } from "nstrumenta/dist/browser/client";
import React from "react";
import { useLocation } from "react-router-dom";
import Webcam from "react-webcam";
import { v4 as uuidv4 } from "uuid";
import "./index.css";

const FACING_MODE_USER = "user";
const FACING_MODE_ENVIRONMENT = "environment";

const videoConstraints = {
  facingMode: FACING_MODE_USER,
};

type Detection = {
  score: number;
  label: string;
  imageTag: string;
};

type Occupation = "empty" | "present";
let occupation: Occupation = "empty";

const Camera = () => {
  const [captureInterval, setCaptureInterval] = React.useState<number | string>(
    1
  );
  const { search } = useLocation();
  const [labelName, setLabelName] = React.useState("obj");
  const webcamRef = React.useRef(null);
  const webcamContainerRef = React.useRef(null);
  const [responseChannel, setResponseChannel] = React.useState(uuidv4());
  const [imgSrc, setImgSrc] = React.useState(null);
  const nstClientRef = React.useRef<NstrumentaBrowserClient>(null);
  const [facingMode, setFacingMode] = React.useState(FACING_MODE_USER);
  const [detections, setDetections] = React.useState<Array<Detection>>([]);

  const capture = React.useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) return;
    setImgSrc(imageSrc);
    const data = imageSrc.split(",")[1];
    const imageTag = uuidv4();
    nstClientRef.current?.send("preprocessing", {
      data,
      responseChannel,
      imageTag,
    });
  }, [webcamRef, setImgSrc]);

  React.useEffect(() => {
    if (captureInterval && typeof captureInterval !== "string") {
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

  React.useEffect(() => {
    const wsUrlParam = new URLSearchParams(search).get("wsUrl");
    const wsUrl = wsUrlParam
      ? wsUrlParam
      : window.location.origin.replace("http", "ws");
    const apiKeyParam = new URLSearchParams(search).get("apiKey");
    if (apiKeyParam) {
      localStorage.setItem("apiKey", apiKeyParam);
    }

    const apiLocalStore = localStorage.getItem("apiKey");
    const apiKey = apiKeyParam ? apiKeyParam : apiLocalStore;

    nstClientRef.current = new NstrumentaBrowserClient();

    nstClientRef.current.addListener("open", () => {
      nstClientRef.current.addSubscription(responseChannel, (response) => {
        const stdout = response.stdout;
        console.log(stdout);
        const lines = stdout.split("\n");
        const newDetections: Array<Detection> = [];
        const resultIndex = lines.findIndex(
          (line) => line == "-------RESULTS--------"
        );
        const label = lines[resultIndex + 1].split(":")[0];
        const score = Number(lines[resultIndex + 1].split(":")[1]) * 100;
        const imageTag = response.imageTag;

        newDetections.push({
          score,
          label,
          imageTag,
        });
        setDetections(newDetections);
      });
    });

    nstClientRef.current.connect({ wsUrl, apiKey });
  }, []);

  const train = React.useCallback(() => {
      const msg = "train";
      nstClientRef.current?.send("retrain", { msg });
    }, []);

  const reset = React.useCallback(() => {
      const msg = "reset";
      nstClientRef.current?.send("reset", { msg });
    }, []);

    const handleChange = React.useCallback((event) => {
      setLabelName(event.target.value);
    }, [labelName]);

    const dataSet = React.useCallback(() => {
      console.log(labelName);
      if (labelName) {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (!imageSrc) return;
        setImgSrc(imageSrc);
        const data = imageSrc.split(",")[1];
        const dir = labelName;
        nstClientRef.current?.send("fsl-folder", {
          data,
          dir,
        });
        console.log("Added to data!");
      }
    }, [labelName, webcamRef, setImgSrc]);
  
  return (
    <>
      <div
        style={{
          display: "grid",
        }}
        ref={webcamContainerRef}
      >
        <Webcam
          width={"100%"}
          audio={false}
          ref={webcamRef}
          style={{
            gridRowStart: 1,
            gridColumnStart: 1,
            zIndex: 1,
          }}
          forceScreenshotSourceSize={false}
          screenshotFormat="image/jpeg"
          videoConstraints={{
            ...videoConstraints,
            facingMode,
          }}
        />
        <svg
          style={{
            width: "100%",
            height: "100%",
            gridRowStart: 1,
            gridColumnStart: 1,
            zIndex: 2,
          }}
        >
          {detections.map((detection) => {
            const { label, score, imageTag } = detection;
            return (
              <>
                <text
                  x={svgScalingWidth(5)}
                  y={svgScalingHeight(30)}
                  fill="green"
                  fontSize="35"
                >
                    {`${label} ${score.toFixed(0)}%`}
                </text>
              </>
            );
          })}
        </svg>
      </div>

      <Grid container spacing={2} direction={"row"}>
        <Grid item>
          <Button color="inherit" variant="outlined" onClick={handleClick}>
            Switch View
          </Button>
        </Grid>
        <Grid item>
          <Button color="inherit" variant="outlined" onClick={train}>
            Train
          </Button>
        </Grid>
        <Grid item>
          <Button color="inherit" variant="outlined" onClick={dataSet}>
            Capture
          </Button>
        </Grid>
        <Grid item>
          <Button color="inherit" variant="outlined" onClick={reset}>
            Reset
          </Button>
        </Grid>
        <Grid item>
          <Input onChange={handleChange} defaultValue="object 1" />
        </Grid>
      </Grid>
    </>
    
  );
};

export default Camera;
