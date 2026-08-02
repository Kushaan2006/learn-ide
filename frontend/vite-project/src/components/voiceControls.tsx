import { useVoiceChat } from "../hooks/useVoiceChat";

interface VoiceControlsProps {
  role: "teacher" | "student";
}

export default function VoiceControls({ role }: VoiceControlsProps) {
  const {
    remoteAudioRef,
    voiceStatus,
    isMuted,
    joinVoice,
    toggleMute,
    leaveVoice,
  } = useVoiceChat({ role });

  const isInVoice =
    voiceStatus === "joining" ||
    voiceStatus === "connecting" ||
    voiceStatus === "connected";

  return (
    <section className="voice-controls flex items-center gap-2">
      {!isInVoice ? (
        <button type="button" className="btn btn-sm" onClick={joinVoice}>
          Join Voice
        </button>
      ) : (
        <>
          <button
            type="button"
            className="btn btn-sm"
            onClick={toggleMute}
            disabled={voiceStatus !== "connected"}
          >
            {isMuted ? "Unmute" : "Mute"}
          </button>

          <button type="button" className="btn btn-sm" onClick={leaveVoice}>
            Leave Voice
          </button>
        </>
      )}

      <span className="voice-status text-sm">Voice: {voiceStatus}</span>

      <audio ref={remoteAudioRef} autoPlay />
    </section>
  );
}
