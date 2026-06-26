import { useEffect, useState } from "react";
import { socket } from "../src/socket";

import type { Role, JoinRoomPayload } from "../src/types";
import { useLocation } from "react-router-dom";

export default function IDE() {
  //   const [details, setDetails] = useState<JoinRoomPayload | null>(null);

  const location = useLocation();
  const details = location.state;

  //   useEffect(() => {
  //     socket.on("joined-room", (payload) => {
  //       setDetails(payload);
  //     });
  //     return () => {
  //       socket.off("joined-room");
  //     };
  //   }, []);

  return (
    <>
      <h2>Code: {details?.roomId}</h2>
      <p>Name: {details?.username}</p>
      <p>Role: {details?.role}</p>
    </>
  );
}
