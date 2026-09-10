import { useState } from "react";
import { JaaSMeeting } from "@jitsi/react-sdk";
type VoiceControlsProps = {
  roomId: string;
  username: string;
  role: "teacher" | "student";
};

export default function VoiceControls({
  roomId,
  username,
  role,
}: VoiceControlsProps) {
  const [voiceToken, setVoiceToken] = useState<string | null>(null);
  const [voiceRoom, setVoiceRoom] = useState<string | null>(null);

  const joinVoice = async () => {
    const serverUrl =
      import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

    const res = await fetch(`${serverUrl}/api/voice/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        roomId,
        username,
        role,
      }),
    });

    const data = await res.json();

    setVoiceToken(data.token);
    setVoiceRoom(data.roomName);

    console.log("Voice Room: ", data.roomName);
    console.log("Voice JWT received: ", data.token);
  };

  if (!voiceToken || !voiceRoom) {
    return (
      <>
        <button
          type="button"
          onClick={joinVoice}
          className="inline-flex h-10 min-w-[110px] items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-content"
        >
          Join Voice
        </button>
      </>
    );
  }

  return (
    <JaaSMeeting
      appId={import.meta.env.VITE_JAAS_APP_ID}
      roomName={voiceRoom}
      jwt={voiceToken}
      userInfo={{
        displayName: username,
        email: "",
      }}
      configOverwrite={{
        startAudioOnly: true,
        startWithVideoMuted: true,
        startWithAudioMuted: false,
      }}
      getIFrameRef={(iframeRef) => {
        iframeRef.style.height = "500px";
        iframeRef.style.width = "100%";
      }}
    />
  );
}
