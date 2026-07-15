interface RunButtonProps {
  isRunning: boolean;
  onRun: () => void;
}

export default function RunButton({ isRunning, onRun }: RunButtonProps) {
  return (
    <button type="button" onClick={onRun} disabled={isRunning}>
      {isRunning ? "Running..." : "Run Code"}
    </button>
  );
}
