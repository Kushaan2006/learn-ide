import { useEffect, useState, type SetStateAction } from "react";
import { EditorView } from "@codemirror/view";
import { socket } from "../src/socket";
import CodeMirror from "@uiw/react-codemirror";
import { cpp } from "@codemirror/lang-cpp";
import { oneDark } from "@codemirror/theme-one-dark";

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

  const shouldUpdateReview = (value: string, previousValue: string) => {
    const trimmed = value.trimEnd();

    return (
      value.endsWith("\n") ||
      trimmed.endsWith(";") ||
      trimmed.endsWith("{") ||
      trimmed.endsWith("}") ||
      trimmed.endsWith(")") ||
      trimmed.endsWith(">") ||
      value.length < previousValue.length
    );
  };

  return (
    <>
      <h2>Code: {details?.roomId}</h2>
      <p>Name: {details?.username}</p>
      <p>Role: {details?.role}</p>
      <div
        style={{
          display: "flex",
          width: "100%",
          gap: "16px",
          padding: "16px",
          boxSizing: "border-box",
        }}
      >
        <div style={{ flex: 1 }}>
          <h3>Student Code</h3>
          <CodeMirror
            value={studentCode}
            height="400px"
            theme={oneDark}
            extensions={[cpp()]}
            editable={details.role === "student"}
            onChange={(value) => {
              if (details.role !== "student") return;
              const previousValue = value;
              setStudentCode(value);
              socket.emit("live-code-update", value);

              const trimmed = value.trimEnd();

              if (shouldUpdateReview(value, previousValue)) {
                setReviewCode(value);
                socket.emit("review-code-update", value);
              }
            }}
          />
        </div>

        <div style={{ flex: 1 }}>
          <h3>Teacher Review</h3>
          <CodeMirror
            value={reviewCode}
            height="400px"
            theme={oneDark}
            extensions={[cpp()]}
            editable={false}
          />
        </div>
      </div>
    </>
  );
}
