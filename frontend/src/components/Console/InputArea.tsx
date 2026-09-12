import { useEffect, type Dispatch, type SetStateAction } from "react";
import { socket } from "../../services/socket";

type InputAreaProps = {
  stdin: string;
  setStdin: Dispatch<SetStateAction<string>>;
  isRunning: boolean;
};

export default function InputArea({
  stdin,
  setStdin,
  isRunning,
}: InputAreaProps) {
  useEffect(() => {
    const handleInputUpdate = (input: string) => {
      setStdin(input);
    };
    socket.on("input-updated", handleInputUpdate);

    return () => {
      socket.off("input-updated", handleInputUpdate);
    };
  }, []);

  const inputUpdate = (event: {
    target: { value: SetStateAction<string> };
  }) => {
    setStdin(event.target.value);
    socket.emit("input-update", event.target.value);
  };

  return (
    <>
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
    </>
  );
}
