import { useState } from "react";

export default function CheckBackendStatus() {
  const [msg, setMsg] = useState("");
  const [recvRes, setRecvRes] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const handleClick = async () => {
    try {
      setConnectionStatus("idle");
      const response = await fetch("http://localhost:3000/api/health");

      if (!response.ok) {
        throw new Error("Backed Connection Failed ;-;");
      }

      const data = await response.json();
      setMsg(data.message);
      setConnectionStatus("success");
    } catch (error) {
      setMsg("Could not Connect to Backend");
      setConnectionStatus("error");
    }
  };

  return (
    <>
      <div>
        <button onClick={handleClick}>Ping Backend</button>
        <br></br>
        <p
          style={{
            color: connectionStatus === "success" ? "green" : "orange",
          }}
        >
          {msg}
        </p>
      </div>
    </>
  );
}
