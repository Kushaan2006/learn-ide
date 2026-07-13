import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

import CodeMirror from "@uiw/react-codemirror";
import { cpp } from "@codemirror/lang-cpp";
import { oneDark } from "@codemirror/theme-one-dark";

import { socket } from "../services/socket";

import type { JoinRoomPayload } from "../types/session.types";

export default function SessionPage() {
  const [studentCode, setStudentCode] = useState("");
  const [reviewCode, setReviewCode] = useState("");

  //output
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const location = useLocation();

  const details = location.state as JoinRoomPayload | null;

  useEffect(() => {
    const handleLiveCodeUpdated = (newCode: string) => {
      setStudentCode(newCode);
    };

    const handleReviewCodeUpdated = (newCode: string) => {
      setReviewCode(newCode);
    };

    socket.on("live-code-updated", handleLiveCodeUpdated);

    socket.on("review-code-updated", handleReviewCodeUpdated);

    return () => {
      socket.off("live-code-updated", handleLiveCodeUpdated);

      socket.off("review-code-updated", handleReviewCodeUpdated);
    };
  }, []);

  if (!details) {
    return <Navigate to="/" replace />;
  }

  const runCode = async () => {
    try {
      setIsRunning(true);
      setOutput("Running...");

      const response = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/api/compile`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            language: "cpp",
            code: studentCode,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setOutput(data.error || "Request failed.");
        return;
      }

      if (!data.success) {
        setOutput(data.stderr || "Compilation failed.");
        return;
      }

      setOutput(data.stdout || "Program finished with no output.");
    } catch {
      setOutput("Could not connect to the compiler service.");
    } finally {
      setIsRunning(false);
    }
  };

  const shouldUpdateReview = (value: string, previousValue: string) => {
    const trimmedValue = value.trimEnd();

    return (
      value.endsWith("\n") ||
      trimmedValue.endsWith(";") ||
      trimmedValue.endsWith("{") ||
      trimmedValue.endsWith("}") ||
      trimmedValue.endsWith(")") ||
      trimmedValue.endsWith(">") ||
      value.length < previousValue.length
    );
  };

  const handleStudentCodeChange = (value: string) => {
    if (details.role !== "student") {
      return;
    }

    const previousValue = studentCode;

    setStudentCode(value);
    socket.emit("live-code-update", value);

    if (shouldUpdateReview(value, previousValue)) {
      setReviewCode(value);
      socket.emit("review-code-update", value);
    }
  };

  return (
    <main className="session-page">
      <header className="session-header">
        <div>
          <h1>Live Coding Session</h1>

          <p>
            Room:
            <strong> {details.roomId}</strong>
          </p>
        </div>

        <div className="session-user">
          <span>{details.username}</span>
          <span className="role-badge">{details.role}</span>
        </div>
      </header>

      <section className="editor-grid">
        <article className="editor-panel">
          <header className="editor-panel-header">
            <h2>Student Workspace</h2>

            <span>{details.role === "student" ? "Editable" : "Read only"}</span>
            <button type="button" onClick={runCode} disabled={isRunning}>
              {isRunning ? "Running..." : "Run Code"}
            </button>
          </header>

          <CodeMirror
            value={studentCode}
            height="100%"
            minHeight="450px"
            theme={oneDark}
            extensions={[cpp()]}
            editable={details.role === "student"}
            onChange={handleStudentCodeChange}
          />
        </article>

        <article className="editor-panel">
          <header className="editor-panel-header">
            <h2>Review Workspace</h2>
            <span>Read only</span>
          </header>

          <CodeMirror
            value={reviewCode}
            height="100%"
            minHeight="450px"
            theme={oneDark}
            extensions={[cpp()]}
            editable={false}
          />
        </article>
      </section>
      <section className="output-panel">
        <header>
          <h2>Output</h2>
        </header>

        <pre>{output || "Output will appear here."}</pre>
      </section>
    </main>
  );
}
