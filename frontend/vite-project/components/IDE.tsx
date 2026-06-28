import { useEffect, useState, type SetStateAction } from "react";
import { socket } from "../src/socket";

import type { Role, JoinRoomPayload } from "../src/types";
import { useLocation } from "react-router-dom";

export default function IDE() {
  //   const [details, setDetails] = useState<JoinRoomPayload | null>(null);
  // const [code, setCode] = useState("");
  const [studentCode, setStudentCode] = useState("");
  const [reviewCode, setReviewCode] = useState("");
  const location = useLocation();
  const details = location.state;

  useEffect(() => {
    socket.on("live-code-updated", (newCode: string) => {
      setStudentCode(newCode);
    });

    socket.on("review-code-updated", (newCode: string) => {
      setReviewCode(newCode);
    });

    return () => {
      socket.off("live-code-updated");
      socket.off("review-code-updated");
    };
  }, []);

  const handleStudentCodeChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    const latestCode = e.target.value;
    setStudentCode(latestCode);
    socket.emit("live-code-update", latestCode);
  };

  const handleStudentEnter = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (details.role !== "student") return;

    if (
      e.key === "Enter" ||
      e.key === ";" ||
      e.key === "{" ||
      e.key === "}" ||
      e.key === "ArrowUp" ||
      e.key === "ArrowDown"
    ) {
      const textarea = e.currentTarget;

      setTimeout(() => {
        const latestCode = textarea.value;
        setReviewCode(latestCode);
        socket.emit("review-code-update", latestCode);
      }, 0);
    }

    if (e.key === "Backspace") {
      const textarea = e.currentTarget;
      setTimeout(() => {
        const text = textarea.value;
        setReviewCode(text);
        socket.emit("review-code-update", text);
      }, 0);
    }
  };

  return (
    <>
      <h2>Code: {details?.roomId}</h2>
      <p>Name: {details?.username}</p>
      <p>Role: {details?.role}</p>
      <div style={{ display: "flex", gap: "16px" }}>
        <div style={{ width: "50%" }}>
          <h3>Student Code</h3>
          <textarea
            value={studentCode}
            onChange={
              details.role === "student" ? handleStudentCodeChange : undefined
            }
            onKeyDown={
              details.role === "student" ? handleStudentEnter : undefined
            }
            readOnly={details.role === "teacher"}
            placeholder={
              details.role === "student"
                ? "Code here..."
                : "Waiting for student code..."
            }
            style={{ width: "100%", height: "400px" }}
          />
        </div>

        <div style={{ width: "50%" }}>
          <h3>Teacher Review</h3>
          <textarea
            value={reviewCode}
            readOnly
            placeholder="Line-by-line review appears here..."
            style={{ width: "100%", height: "400px" }}
          />
        </div>
      </div>
    </>
  );
}
