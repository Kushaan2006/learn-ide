import { useRef } from "react";

export function useVoiceChat(){
    const localStream = useRef<MediaStream | null> (null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

    const startMicrophone = async() => {
        try{
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true
            });

            localStream.current = stream;

            console.log("Microphone Stream: " ,stream);

        } catch(error){
            console.log("Microphone Error: ", error);
        }
    }

    


    return startMicrophone;
}