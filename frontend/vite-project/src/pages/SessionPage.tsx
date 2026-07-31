import { useEffect, useState, type SetStateAction } from "react";
import { Navigate, useLocation } from "react-router-dom";

import CodeMirror from "@uiw/react-codemirror";
import { cpp } from "@codemirror/lang-cpp";
import { oneDark } from "@codemirror/theme-one-dark";

import { socket } from "../services/socket";

import type { JoinRoomPayload } from "../types/session.types";
import RunButton from "../components/RunButton";
import VoiceControls from "../components/voiceControls";

export default function SessionPage() {
  interface ExecutionUpdate {
    isRunning: boolean;
    output: string;
  }

  const [studentCode, setStudentCode] = useState("");
  const [reviewCode, setReviewCode] = useState("");

  //output
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  //input
  const [stdin, setStdin] = useState("");

  const location = useLocation();

  const details = location.state as JoinRoomPayload | null;

  useEffect(() => {
    const handleLiveCodeUpdated = (newCode: string) => {
      setStudentCode(newCode);
    };

    const handleReviewCodeUpdated = (newCode: string) => {
      setReviewCode(newCode);
    };

    const handleRunningCodeUpdate = ({
      isRunning,
      output,
    }: ExecutionUpdate) => {
      setOutput(output);
      setIsRunning(isRunning);
    };

    const handleInputUpdate = (input: string) => {
      setStdin(input);
    };

    socket.on("live-code-updated", handleLiveCodeUpdated);

    socket.on("review-code-updated", handleReviewCodeUpdated);

    socket.on("code-executed", handleRunningCodeUpdate);

    socket.on("input-updated", handleInputUpdate);

    return () => {
      socket.off("live-code-updated", handleLiveCodeUpdated);

      socket.off("review-code-updated", handleReviewCodeUpdated);

      socket.off("code-executed", handleRunningCodeUpdate);

      socket.off("input-updated", handleInputUpdate);
    };
  }, []);

  if (!details) {
    return <Navigate to="/" replace />;
  }

  const updateExecution = ({ isRunning, output }: ExecutionUpdate) => {
    setIsRunning(isRunning);
    setOutput(output);

    socket.emit("code-running", { isRunning, output });
  };

  const runCode = async () => {
    let out = "";
    try {
      updateExecution({ isRunning: true, output: "Running..." });
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
            stdin,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        updateExecution({
          isRunning: false,
          output: data.error || "Request failed.",
        });

        return;
      }

      if (!data.success) {
        updateExecution({
          isRunning: false,
          output: data.stderr || "Compilation failed.",
        });

        return;
      }

      updateExecution({
        isRunning: false,
        output: data.stdout || "Program finished with no output.",
      });
      out = data.stdout;
    } catch {
      updateExecution({
        isRunning: false,
        output: "Could not connect to the compiler service.",
      });
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

  const handleReviewCodeChange = (value: string) => {
    setReviewCode(value);
    socket.emit("review-code-update", value);
  };

  const inputUpdate = (event: {
    target: { value: SetStateAction<string> };
  }) => {
    setStdin(event.target.value);
    socket.emit("input-update", event.target.value);
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
          <VoiceControls role={details.role} />
          <span>{details.username}</span>
          <span className="role-badge">{details.role}</span>
        </div>
      </header>

      <section className="editor-grid">
        <article className="editor-panel">
          <header className="editor-panel-header">
            <h2>Student Workspace</h2>

            <span>{details.role === "student" ? "Editable" : "Read only"}</span>
            <RunButton isRunning={isRunning} onRun={runCode}></RunButton>
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
            editable={details.role === "teacher"}
            onChange={handleReviewCodeChange}
          />
        </article>
      </section>
      <section className="input-panel">
        <textarea
          value={stdin}
          onChange={inputUpdate}
          placeholder={"Enter input in sequential order"}
          disabled={isRunning}
        />
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
