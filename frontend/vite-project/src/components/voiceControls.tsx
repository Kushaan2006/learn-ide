import { useVoiceChat } from "../hooks/useVoiceChat";

export default function VoiceControls() {
  const {
    startMicrophone,
    createPeerConnection,
    addMicrophoneToPeer,
    createAndSendOffer,
    remoteAudioRef,
  } = useVoiceChat();

  return (
    <>
      <button onClick={startMicrophone}>Enable Microphone</button>
      <button onClick={createPeerConnection}>Create PC</button>
      <button type="button" onClick={addMicrophoneToPeer}>
        Add Microphone
      </button>
      <button type="button" onClick={createAndSendOffer}>
        Start Voice Call
      </button>
      <audio ref={remoteAudioRef} autoPlay />
    </>
  );
}
