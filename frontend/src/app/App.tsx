import { Route, Routes } from "react-router-dom";

import JoinRoomPage from "../pages/JoinRoomPage";
import SessionPage from "../pages/SessionPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<JoinRoomPage />} />

      <Route path="/session/:roomId" element={<SessionPage />} />
    </Routes>
  );
}
