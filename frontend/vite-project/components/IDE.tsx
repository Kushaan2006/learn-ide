import { useEffect, useState, type SetStateAction } from "react";
import { socket } from "../src/socket";

import type { Role, JoinRoomPayload } from "../src/types";
import { useLocation } from "react-router-dom";

export default function IDE() {
  //   const [details, setDetails] = useState<JoinRoomPayload | null>(null);
  const [code, setCode] = useState("");
  const location = useLocation();
  const details = location.state;

  useEffect(() => {
    socket.on("code-updated", (payload) => {
      setCode(payload);
    });
    return () => {
      socket.off("code-updated");
    };
  }, []);

  const sendCodeChanges = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setCode(newCode);
    socket.emit("update-code", newCode);
  };

  return (
    <>
      <h2>Code: {details?.roomId}</h2>
      <p>Name: {details?.username}</p>
      <p>Role: {details?.role}</p>
      <textarea
        name=""
        id=""
        onChange={details.role === "student" ? sendCodeChanges : undefined}
        readOnly={details.role === "teacher"}
        value={code}
      ></textarea>
    </>
  );
}
