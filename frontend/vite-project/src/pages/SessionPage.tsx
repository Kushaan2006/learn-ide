import { useEffect, useState, type SetStateAction } from "react";
import { Navigate, useLocation } from "react-router-dom";

import CodeMirror from "@uiw/react-codemirror";
import { cpp } from "@codemirror/lang-cpp";
import { oneDark } from "@codemirror/theme-one-dark";

import { socket } from "../services/socket";

import type { JoinRoomPayload } from "../types/session.types";
import RunButton from "../components/RunButton";
// import VoiceControls from "../components/voiceControls";

export default function SessionPage() {
  interface ExecutionUpdate {
    isRunning: boolean;
    output: string;
  }

  const backendURL = import.meta.env.VITE_SERVER_URL;

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

    socket.on("review-code-changed", handleReviewCodeUpdated);

    socket.on("code-executed", handleRunningCodeUpdate);

    socket.on("input-updated", handleInputUpdate);

    return () => {
      socket.off("live-code-updated", handleLiveCodeUpdated);

      socket.off("review-code-updated", handleReviewCodeUpdated);

      socket.off("code-executed", handleRunningCodeUpdate);

      socket.off("input-updated", handleInputUpdate);

      socket.off("review-code-changed", handleReviewCodeUpdated);
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
    // let out = "";
    try {
      updateExecution({ isRunning: true, output: "Running..." });
      const response = await fetch(`${backendURL}/api/compile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language: "cpp",
          code: studentCode,
          stdin,
        }),
      });

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
      // out = data.stdout;
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

  const reviewCodeRecommended = (value: string) => {
    setReviewCode(value);
    socket.emit("review-code-change", value);
  };

  const inputUpdate = (event: {
    target: { value: SetStateAction<string> };
  }) => {
    setStdin(event.target.value);
    socket.emit("input-update", event.target.value);
  };

  return (
    <main className="flex min-h-screen flex-col bg-base-200">
      {/* Top navbar */}
      <header className="navbar border-b border-base-300 bg-base-100 px-4 shadow-sm">
        <div className="flex-1">
          <div>
            <h1 className="text-xl font-bold">Learn IDE</h1>

            <p className="text-sm text-base-content/60">
              Room:
              <span className="ml-1 font-bold">{details.roomId}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* <VoiceControls role={details.role} roomId={details.roomId} /> */}

          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium">{details.username}</p>
            <p className="text-xs capitalize text-base-content/60">
              {details.role}
            </p>
          </div>

          <div className="badge badge-primary capitalize">{details.role}</div>
        </div>
      </header>

      {/* Main workspace */}
      <div className="flex flex-1 flex-col gap-4 p-4">
        {/* Editors */}
        <section className="grid flex-1 grid-cols-1 gap-4 xl:grid-cols-2">
          {/* Student editor */}
          <article className="flex min-h-125 flex-col overflow-hidden rounded-box border border-base-300 bg-base-100 shadow-md">
            <header className="flex items-center justify-between border-b border-base-300 px-4 py-3">
              <div>
                <h2 className="font-semibold">Student Workspace</h2>

                <p className="text-xs text-base-content/60">
                  {details.role === "student" ? "Editable" : "Read only"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`badge badge-sm ${
                    details.role === "student" ? "badge-success" : "badge-ghost"
                  }`}
                >
                  {details.role === "student" ? "Editing" : "Viewing"}
                </span>

                <RunButton isRunning={isRunning} onRun={runCode} />
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-hidden">
              <CodeMirror
                value={studentCode}
                height="100%"
                minHeight="500px"
                theme={oneDark}
                extensions={[cpp()]}
                editable={details.role === "student"}
                onChange={handleStudentCodeChange}
                className="h-full"
              />
            </div>
          </article>

          {/* Review editor */}
          <article className="flex min-h-125 flex-col overflow-hidden rounded-box border border-base-300 bg-base-100 shadow-md">
            <header className="flex items-center justify-between border-b border-base-300 px-4 py-3">
              <div>
                <h2 className="font-semibold">Review Workspace</h2>

                <p className="text-xs text-base-content/60">
                  {details.role === "teacher" ? "Editable" : "Read only"}
                </p>
              </div>

              <span
                className={`badge badge-sm ${
                  details.role === "teacher" ? "badge-success" : "badge-ghost"
                }`}
              >
                {details.role === "teacher" ? "Editing" : "Viewing"}
              </span>
            </header>

            <div className="min-h-0 flex-1 overflow-hidden">
              <CodeMirror
                value={reviewCode}
                height="100%"
                minHeight="500px"
                theme={oneDark}
                extensions={[cpp()]}
                editable={details.role === "teacher"}
                onChange={reviewCodeRecommended}
                className="h-full"
              />
            </div>
          </article>
        </section>

        {/* Console */}
        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Input */}
          <article className="rounded-box border border-base-300 bg-base-100 shadow-sm">
            <header className="border-b border-base-300 px-4 py-3">
              <h2 className="font-semibold">Standard Input</h2>
              <p className="text-xs text-base-content/60">
                Enter values exactly as your program expects them.
              </p>
            </header>

            <div className="p-4">
              <textarea
                value={stdin}
                onChange={inputUpdate}
                placeholder={"Example:\n5\n10 20 30 40 50"}
                disabled={isRunning}
                className="textarea textarea-bordered min-h-32 w-full resize-y font-mono"
              />
            </div>
          </article>

          {/* Output */}
          <article className="rounded-box border border-base-300 bg-base-100 shadow-sm">
            <header className="flex items-center justify-between border-b border-base-300 px-4 py-3">
              <div>
                <h2 className="font-semibold">Output</h2>
                <p className="text-xs text-base-content/60">
                  Program output and compiler errors appear here.
                </p>
              </div>

              {isRunning && (
                <span className="loading loading-spinner loading-sm" />
              )}
            </header>

            <pre className="min-h-32 overflow-auto whitespace-pre-wrap p-4 font-mono text-sm">
              {output || "Output will appear here."}
            </pre>
          </article>
        </section>
      </div>
    </main>
  );
}
