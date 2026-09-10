import { useState } from "react";

const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

type ConnectionStatus = "idle" | "success" | "error";

export default function BackendStatus() {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<ConnectionStatus>("idle");

  const handleClick = async () => {
    try {
      setStatus("idle");
      setMessage("Checking...");

      const response = await fetch(`${serverUrl}/api/health`);

      const data = await response.json();

      if (!response.ok) {
        setStatus("error");
        setMessage(data.error || "Backend connection failed.");
        return;
      }

      setStatus("success");
      setMessage(data.message);
    } catch {
      setStatus("error");
      setMessage("Could not connect to backend.");
    }
  };

  return (
    <div className="backend-status">
      <button type="button" onClick={handleClick}>
        Ping Backend
      </button>

      {message && <p className={`status-${status}`}>{message}</p>}
    </div>
  );
}
