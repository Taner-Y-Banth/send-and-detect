import Button from "@mui/material/Button";
import { NstrumentaBrowserClient } from "nstrumenta/dist/browser/client";
import React from "react";
import { useLocation } from "react-router-dom";
import Webcam from "react-webcam";
import { v4 as uuidv4 } from 'uuid';
import "./index.css";

const FACING_MODE_USER = "user";
const FACING_MODE_ENVIRONMENT = "environment";

const videoConstraints = {
  facingMode: FACING_MODE_USER,
};

type Detection = {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
  label: string;
};

const Camera = () => {
  const [qty, setQty] = React.useState(null);
  const webcamRef = React.useRef(null);
  const webcamContainerRef = React.useRef(null);
  const [responseChannel, setResponseChannel] = React.useState(uuidv4());
  const [imgSrc, setImgSrc] = React.useState(null);
  const nstClientRef = React.useRef<NstrumentaBrowserClient>(null);
  const [facingMode, setFacingMode] = React.useState(FACING_MODE_USER);
  const [detections, setDetections] = React.useState<Array<Detection>>([]);
  const capture = React.useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    setImgSrc(imageSrc);
    const data = imageSrc.split(",")[1];
    nstClientRef.current?.send(
      "preprocessing",
      {data, responseChannel}
    );
  }, [webcamRef, setImgSrc]);

  React.useEffect(() => {
    if (qty && !isNaN(qty)) {
      const interval = setInterval(() => {
        capture();
      }, qty * 1000);
      return () => clearInterval(interval);
    }
  }, [qty]);

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
        console.log(response);
        const lines = response.split("\n");
        const newDetections: Array<Detection> = [];
        const resultIndex = lines.findIndex(
          (line) => line == "-------RESULTS--------"
        );
        for (let i = resultIndex + 1; i + 3 < lines.length; i += 4) {
          const score = Number(lines[i + 2].split(":")[1]) * 100;
          const label = `${lines[i]} ${score.toFixed(0)}`;
          const regex = /[0-9]+/g;
          const [xmin, ymin, xmax, ymax] = lines[i + 3]
            .match(regex)
            .map(Number);
          newDetections.push({ label, xmin, xmax, ymin, ymax });
        }
        setDetections(newDetections);
      });
    });

    nstClientRef.current.connect({ wsUrl, apiKey });
  }, []);

  return (
    <>
      <div style={{ display: "grid" }} ref={webcamContainerRef}>
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
            const { xmin, xmax, ymin, ymax, label } = detection;
            return (
              <>
                <rect
                  fill="none"
                  stroke="green"
                  strokeWidth="2px"
                  x={svgScalingWidth(xmin)}
                  y={svgScalingHeight(ymin)}
                  width={svgScalingWidth(xmax - xmin)}
                  height={svgScalingHeight(ymax - ymin)}
                />
                <text
                  x={svgScalingWidth(xmin + 3)}
                  y={svgScalingHeight(ymin + 20)}
                  fill="green"
                >
                  {label}
                </text>
              </>
            );
          })}
        </svg>
      </div>
      <input
        placeholder="Enter Interval Here"
        onBlur={(e) => {
          setQty(Number.parseFloat(e.target.value));
        }}
      />
      <Button color="inherit" variant="outlined" onClick={handleClick}>
        Switch View
      </Button>
      <Button color="inherit" variant="outlined" onClick={capture}>
        Capture photo
      </Button>
    </>
  );
};

export default Camera;
