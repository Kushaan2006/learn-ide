import { useVoiceChat } from "../hooks/useVoiceChat";

export default function VoiceControls() {
  const startMicrophone = useVoiceChat();

  return <button onClick={startMicrophone}>Enable Microphone</button>;
}
