import { useAgoraVoice } from "../hooks/useVoiceChat";

interface VoiceControlsProps {
  role: "teacher" | "student";
  roomId: string;
}

export default function VoiceControls({ role, roomId }: VoiceControlsProps) {
  const { voiceStatus, isMuted, joinVoice, toggleMute, leaveVoice } =
    useAgoraVoice({
      role,
      roomId,
    });

  const isInVoice = voiceStatus === "joining" || voiceStatus === "connected";

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
    </section>
  );
}
