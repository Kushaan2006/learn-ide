import { useState } from "react";
import { socket } from "../src/socket";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import type { Role, JoinRoomPayload } from "../src/types";
export default function JoinRoom() {
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const [role, setRole] = useState<Role>("student");
  const [msg, setMsg] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    socket.on("joined-room", (payload) => {
      navigate("/ide", {
        state: payload,
      });
    });

    socket.on("join-error", (msg) => {
      setMsg(msg);
    });

    return () => {
      socket.off("joined-room");
      socket.off("join-error");
    };
  }, [navigate]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!username.trim()) return;
    if (role === "student" && !roomId.trim()) return;
    const payload: JoinRoomPayload = {
      username,
      roomId,
      role,
    };
    socket.emit("join-room", payload);
  };

  return (
    <>
      <div>
        <form onSubmit={handleSubmit}>
          <h2>Join Room</h2>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
            }}
          />
          {role === "student" && (
            <>
              <br />
              <input
                type="text"
                placeholder="Room ID"
                value={roomId}
                onChange={(e) => {
                  setRoomId(e.target.value);
                }}
              />
            </>
          )}
          {msg && <p style={{ color: "red" }}>{msg}</p>}
          <br />
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value as Role);
            }}
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>
          <br />
          <button type="submit">
            {role === "student" ? "Join" : "Create"}
          </button>
        </form>
      </div>
    </>
  );
}
