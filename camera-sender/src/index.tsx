import React from "react";
import ReactDOM from "react-dom";
import { HashRouter, Route, Routes } from "react-router-dom";
import AppDrawer from "./AppDrawer";
import Camera from "./Camera";
import "./index.css";
import Live from "./Live";
import Viewer from "./Viewer";

ReactDOM.render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<AppDrawer />}>
          <Route path="" element={<Live />} />
          <Route path="Camera" element={<Camera />} />
          <Route path="viewer" element={<Viewer />} />
        </Route>
      </Routes>
    </HashRouter>
  </React.StrictMode>,
  document.getElementById("root")
);
