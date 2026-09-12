type OutputWindowProps = {
  isRunning: boolean;
  output: string;
};

export default function OutputWindow({ isRunning, output }: OutputWindowProps) {
  return (
    <>
      <article className="rounded-box border border-base-300 bg-base-100 shadow-sm">
        <header className="flex items-center justify-between border-b border-base-300 px-4 py-3">
          <div>
            <h2 className="font-semibold">Output</h2>
            <p className="text-xs text-base-content/60">
              Program output and compiler errors appear here.
            </p>
          </div>

          {isRunning && <span className="loading loading-spinner loading-sm" />}
        </header>

        <pre className="min-h-32 overflow-auto whitespace-pre-wrap p-4 font-mono text-sm">
          {output || "Output will appear here."}
        </pre>
      </article>
    </>
  );
}
