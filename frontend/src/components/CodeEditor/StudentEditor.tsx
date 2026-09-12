import { cpp } from "@codemirror/lang-cpp";
import CodeMirror, { oneDark, StateEffectType } from "@uiw/react-codemirror";
import { socket } from "../../services/socket";
import { useEffect, type Dispatch, type SetStateAction } from "react";
import type { Role } from "../../types/session.types";

type StudentEditorProps = {
  studentCode: string;
  setStudentCode: Dispatch<SetStateAction<string>>;
  setReviewCode: Dispatch<SetStateAction<string>>;
  details: {
    username: string;
    roomId: string;
    role: Role;
  };
};

export default function StudentEditor({
  studentCode,
  setStudentCode,
  setReviewCode,
  details,
}: StudentEditorProps) {
  useEffect(() => {
    const handleLiveCodeUpdated = (newCode: string) => {
      setStudentCode(newCode);
    };

    socket.on("live-code-updated", handleLiveCodeUpdated);

    return () => {
      socket.off("live-code-updated", handleLiveCodeUpdated);
    };
  }, []);

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
    <>
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
    </>
  );
}
