import { useEffect, useRef } from "react";
import { socket } from "../services/socket";

export function useVoiceChat() {
    const localStreamRef = useRef<MediaStream | null>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const remoteAudioRef =
        useRef<HTMLAudioElement | null>(null);
    const startMicrophone = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true
            });

            localStreamRef.current = stream;

            console.log("Microphone Stream: ", stream);

        } catch (error) {
            console.log("Microphone Error: ", error);
        }
    }

    const createPeerConnection = () => {
        const peerConnection = new RTCPeerConnection({
            iceServers: [
                {
                    urls: "stun:stun.l.google.com:19302",
                },
            ],
        });

        peerConnection.ontrack = (event) => {
            const remoteStream = event.streams[0];

            if (!remoteAudioRef.current) {
                console.error("Remote audio element not found");
                return;
            }

            remoteAudioRef.current.srcObject = remoteStream;

            console.log("Remote audio received:", remoteStream);
        };

        peerConnection.onicecandidate = (event) => {
            if (!event.candidate) {
                return;
            }

            socket.emit("voice-ice-candidate", event.candidate);

            console.log("ICE candidate sent:", event.candidate);
        };



        peerConnectionRef.current = peerConnection;

        console.log("Peer connection created:", peerConnection);
    };

    const addMicrophoneToPeer = () => {
        const stream = localStreamRef.current;
        const peerConnection = peerConnectionRef.current;

        if (!stream) {
            console.error("Microphone not detected");
            return;
        }

        if (!peerConnection) {
            console.error("Peer connection not created");
            return;
        }

        stream.getTracks().forEach((track) => {
            peerConnection.addTrack(track, stream);
        })

        console.log("Microphone Track Added");
    }

    const createAndSendOffer = async () => {
        const peerConnection = peerConnectionRef.current;

        if (!peerConnection) {
            console.error("Peer connection not created");
            return;
        }

        try {
            const offer = await peerConnection.createOffer();

            await peerConnection.setLocalDescription(offer);

            socket.emit("voice-offer", offer);
            console.log("Voice offer created: ", offer);
        } catch (error) {
            console.error("Could not create voice offer: " + error)
        }

    }

    //I was too tired, will fix this later
    useEffect(() => {
        const handleVoiceOffer = async (
            offer: RTCSessionDescriptionInit,
        ) => {
            const peerConnection = peerConnectionRef.current;

            if (!peerConnection) {
                console.error(
                    "Cannot receive offer because peer connection does not exist.",
                );
                return;
            }

            try {
                await peerConnection.setRemoteDescription(offer);

                const answer = await peerConnection.createAnswer();

                await peerConnection.setLocalDescription(answer);

                socket.emit("voice-answer", answer);

                console.log("Voice answer created:", answer);
            } catch (error) {
                console.error("Could not process voice offer:", error);
            }
        };

        const handleVoiceAnswer = async (
            answer: RTCSessionDescriptionInit,
        ) => {
            const peerConnection = peerConnectionRef.current;

            if (!peerConnection) {
                console.error(
                    "Cannot receive answer because peer connection does not exist.",
                );
                return;
            }

            try {
                await peerConnection.setRemoteDescription(answer);

                console.log("Voice answer received:", answer);
            } catch (error) {
                console.error("Could not process voice answer:", error);
            }
        };

        const handleIceCandidate = async (
            candidate: RTCIceCandidateInit,
        ) => {
            const peerConnection = peerConnectionRef.current;

            if (!peerConnection) {
                console.error(
                    "Cannot add ICE candidate because peer connection does not exist.",
                );
                return;
            }

            try {
                await peerConnection.addIceCandidate(candidate);

                console.log("ICE candidate received:", candidate);
            } catch (error) {
                console.error("Could not add ICE candidate:", error);
            }
        };

        socket.on("voice-offer", handleVoiceOffer);
        socket.on("voice-answer", handleVoiceAnswer);
        socket.on("voice-ice-candidate", handleIceCandidate);


        return () => {
            socket.off("voice-offer", handleVoiceOffer);
            socket.off("voice-answer", handleVoiceAnswer);
            socket.off("voice-ice-candidate", handleIceCandidate);
        };
    }, []);


    return { startMicrophone, createPeerConnection, addMicrophoneToPeer, createAndSendOffer, remoteAudioRef, };
}