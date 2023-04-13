import { Grid, Input } from "@mui/material";
import Button from "@mui/material/Button";
import { NstrumentaBrowserClient } from "nstrumenta/dist/browser/client";
import React from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import Webcam from "react-webcam";
import "./index.css";

const FACING_MODE_USER = "user";
const FACING_MODE_ENVIRONMENT = "environment";

const videoConstraints = {
  facingMode: FACING_MODE_USER,
};

const Camera = () => {
  const { search } = useLocation();

  const webcamRef = React.useRef(null);
  const webcamContainerRef = React.useRef(null);
  const [imgSrc, setImgSrc] = React.useState(null);
  const nstClientRef = React.useRef<NstrumentaBrowserClient>(null);
  const [facingMode, setFacingMode] = React.useState(FACING_MODE_USER);
  const [searchParams, setSearchParams] = useSearchParams();

  const capture = React.useCallback(() => {
    const folderName = searchParams.get("folder");
    if (folderName) {
      const imageSrc = webcamRef.current?.getScreenshot();
      if (!imageSrc) return;
      setImgSrc(imageSrc);
      const data = imageSrc.split(",")[1];
      const dir = folderName;
      nstClientRef.current?.send("fsl-folder", {
        data,
        dir,
      });
    }
  }, [webcamRef, setImgSrc]);

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

    nstClientRef.current.connect({ wsUrl, apiKey });
  }, []);

  const train = React.useCallback(() => {
    const msg = "train";
    nstClientRef.current?.send("retrain", { msg });
  }, []);

  const handleChange = React.useCallback((event) => {
    searchParams.set("folder", event.target.value);
    setSearchParams(searchParams);
  }, []);

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
          <Button color="inherit" variant="outlined" onClick={capture}>
            Capture
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
