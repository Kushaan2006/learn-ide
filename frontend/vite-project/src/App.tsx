import { useEffect, useState } from "react";
import { socket } from "./socket";
import CheckBackendStatus from "../components/checkBackendStatus";
import JoinRoom from "../components/JoinRoom";
import IDE from "../components/IDE";
import { Route, Routes } from "react-router-dom";

export default function App() {
  return (
    <>
      <CheckBackendStatus />
      <Routes>
        <Route path="/" element={<JoinRoom />} />
        <Route path="/ide" element={<IDE />} />
      </Routes>
    </>
  );
}
