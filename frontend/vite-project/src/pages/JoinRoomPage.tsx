import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { socket } from "../services/socket";

import type { JoinRoomPayload, Role } from "../types/session.types";

export default function JoinRoomPage() {
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const [role, setRole] = useState<Role>("student");
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const handleJoinedRoom = (payload: JoinRoomPayload) => {
      navigate(`/session/${payload.roomId}`, {
        state: payload,
      });
    };

    const handleJoinError = (message: string) => {
      setErrorMessage(message);
    };

    socket.on("joined-room", handleJoinedRoom);
    socket.on("join-error", handleJoinError);

    return () => {
      socket.off("joined-room", handleJoinedRoom);
      socket.off("join-error", handleJoinError);
    };
  }, [navigate]);

  const checkBackend = async (): Promise<boolean> => {
    try {
      const response = await fetch("http://localhost:3000/api/health");

      if (!response.ok) {
        throw new Error("Backed Connection Failed ;-;");
      }
    } catch (error) {
      setErrorMessage("Could not Connect to Backend");
      return false;
    }

    return true;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    const backendActive = await checkBackend();

    if (!backendActive) return;

    const cleanedUsername = username.trim();
    const cleanedRoomId = roomId.trim().toUpperCase();

    if (!cleanedUsername) {
      setErrorMessage("Username is required.");
      return;
    }

    if (role === "student" && !cleanedRoomId) {
      setErrorMessage("Room ID is required.");
      return;
    }

    const payload: JoinRoomPayload = {
      username: cleanedUsername,
      roomId: role === "teacher" ? "" : cleanedRoomId,
      role,
    };

    socket.emit("join-room", payload);
  };

  return (
    <main className="join-page">
      <form className="join-form" onSubmit={handleSubmit}>
        <h1>Learn IDE</h1>

        <p className="join-subtitle">
          Create or join a live mentoring session.
        </p>

        <label htmlFor="username">Username</label>

        <input
          id="username"
          type="text"
          placeholder="Enter your name"
          value={username}
          onChange={(event) => {
            setUsername(event.target.value);
          }}
        />

        <label htmlFor="role">Role</label>

        <select
          id="role"
          value={role}
          onChange={(event) => {
            setRole(event.target.value as Role);
            setErrorMessage("");
          }}
        >
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
        </select>

        {role === "student" && (
          <>
            <label htmlFor="room-id">Room ID</label>

            <input
              id="room-id"
              type="text"
              placeholder="Example: AB12CD"
              value={roomId}
              onChange={(event) => {
                setRoomId(event.target.value.toUpperCase());
              }}
            />
          </>
        )}

        {errorMessage && <p className="error-message">{errorMessage}</p>}

        <button type="submit">
          {role === "student" ? "Join Session" : "Create Session"}
        </button>
      </form>
    </main>
  );
}
