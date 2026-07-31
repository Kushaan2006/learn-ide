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
    <section className="voice-controls">
      {!isInVoice ? (
        <button type="button" onClick={joinVoice}>
          Join Voice
        </button>
      ) : (
        <>
          <button
            type="button"
            onClick={toggleMute}
            disabled={voiceStatus !== "connected"}
          >
            {isMuted ? "Unmute" : "Mute"}
          </button>

          <button type="button" onClick={leaveVoice}>
            Leave Voice
          </button>
        </>
      )}

      <span className="voice-status">Voice: {voiceStatus}</span>

      <audio ref={remoteAudioRef} autoPlay />
    </section>
  );
}
