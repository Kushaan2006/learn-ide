import { useEffect, useRef, useState } from "react";
import { socket } from "../services/socket";


//this section single handedly was the biggest pain

type VoiceStatus =
    | "idle"
    | "joining"
    | "connecting"
    | "connected"
    | "error";

interface UseVoiceChatOptions {
    role: "teacher" | "student";
}

export function useVoiceChat({
    role,
}: UseVoiceChatOptions) {
    const localStreamRef =
        useRef<MediaStream | null>(null);

    const peerConnectionRef =
        useRef<RTCPeerConnection | null>(null);

    const remoteAudioRef =
        useRef<HTMLAudioElement | null>(null);

    const pendingIceCandidatesRef =
        useRef<RTCIceCandidateInit[]>([]);

    const [voiceStatus, setVoiceStatus] =
        useState<VoiceStatus>("idle");

    const [isMuted, setIsMuted] = useState(false);

    const createPeerConnection = () => {
        if (peerConnectionRef.current) {
            return peerConnectionRef.current;
        }

        const peerConnection =
            new RTCPeerConnection({
                iceTransportPolicy: "relay",
                iceServers: [
                    {
                        urls: "stun:stun.l.google.com:19302",
                    },
                    {
                        urls: [
                            "turn:learn-ide-turn-kushaan.publicvm.com:3478?transport=udp",
                            "turn:learn-ide-turn-kushaan.publicvm.com:3478?transport=tcp",
                        ],
                        username: import.meta.env.VITE_TURN_SERVER_USERNAME,
                        credential: import.meta.env.VITE_TURN_SERVER_PASSWORD,
                    },
                ],
            });

        peerConnection.onicecandidate = (event) => {
            if (!event.candidate) {
                return;
            }

            socket.emit(
                "voice-ice-candidate",
                event.candidate,
            );
        };

        peerConnection.ontrack = (event) => {
            const remoteStream = event.streams[0];

            if (!remoteAudioRef.current) {
                return;
            }

            remoteAudioRef.current.srcObject =
                remoteStream;
        };

        peerConnection.onconnectionstatechange = () => {
            const state =
                peerConnection.connectionState;

            console.log("Voice connection state:", state);

            if (state === "connected") {
                setVoiceStatus("connected");
            }

            if (
                state === "failed" ||
                state === "disconnected"
            ) {
                setVoiceStatus("error");
            }

            if (state === "closed") {
                setVoiceStatus("idle");
            }
        };

        peerConnectionRef.current =
            peerConnection;

        return peerConnection;
    };

    const startMicrophone = async () => {
        if (localStreamRef.current) {
            return localStreamRef.current;
        }

        const stream =
            await navigator.mediaDevices.getUserMedia({
                audio: true,
            });

        localStreamRef.current = stream;

        return stream;
    };

    const addMicrophoneTracks = (
        peerConnection: RTCPeerConnection,
        stream: MediaStream,
    ) => {
        const existingSenders =
            peerConnection.getSenders();

        stream.getTracks().forEach((track) => {
            const alreadyAdded =
                existingSenders.some(
                    (sender) => sender.track === track,
                );

            if (!alreadyAdded) {
                peerConnection.addTrack(
                    track,
                    stream,
                );
            }
        });
    };

    const flushPendingIceCandidates =
        async () => {
            const peerConnection =
                peerConnectionRef.current;

            if (!peerConnection) {
                return;
            }

            for (const candidate of pendingIceCandidatesRef.current) {
                await peerConnection.addIceCandidate(
                    candidate,
                );
            }

            pendingIceCandidatesRef.current = [];
        };

    const joinVoice = async () => {
        if (
            voiceStatus === "joining" ||
            voiceStatus === "connecting" ||
            voiceStatus === "connected"
        ) {
            return;
        }

        try {
            setVoiceStatus("joining");

            const stream = await startMicrophone();

            const peerConnection =
                createPeerConnection();

            addMicrophoneTracks(
                peerConnection,
                stream,
            );

            setVoiceStatus("connecting");

            if (role === "teacher") {
                const offer =
                    await peerConnection.createOffer();

                await peerConnection.setLocalDescription(
                    offer,
                );

                socket.emit("voice-offer", offer);
            }
        } catch (error) {
            console.error(
                "Could not join voice:",
                error,
            );

            setVoiceStatus("error");
        }
    };

    const toggleMute = () => {
        const stream = localStreamRef.current;

        if (!stream) {
            return;
        }

        const nextMutedState = !isMuted;

        stream.getAudioTracks().forEach(
            (track) => {
                track.enabled = !nextMutedState;
            },
        );

        setIsMuted(nextMutedState);
    };

    const cleanupVoice = () => {
        localStreamRef.current
            ?.getTracks()
            .forEach((track) => {
                track.stop();
            });

        localStreamRef.current = null;

        peerConnectionRef.current?.close();
        peerConnectionRef.current = null;

        pendingIceCandidatesRef.current = [];

        if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject =
                null;
        }

        setIsMuted(false);
        setVoiceStatus("idle");
    };

    const leaveVoice = () => {
        socket.emit("voice-leave");
        cleanupVoice();
    };

    useEffect(() => {
        const handleVoiceOffer = async (
            offer: RTCSessionDescriptionInit,
        ) => {
            try {
                setVoiceStatus("connecting");

                const stream =
                    await startMicrophone();

                const peerConnection =
                    createPeerConnection();

                addMicrophoneTracks(
                    peerConnection,
                    stream,
                );

                await peerConnection.setRemoteDescription(
                    offer,
                );

                await flushPendingIceCandidates();

                const answer =
                    await peerConnection.createAnswer();

                await peerConnection.setLocalDescription(
                    answer,
                );

                socket.emit("voice-answer", answer);
            } catch (error) {
                console.error(
                    "Could not handle voice offer:",
                    error,
                );

                setVoiceStatus("error");
            }
        };

        const handleVoiceAnswer = async (
            answer: RTCSessionDescriptionInit,
        ) => {
            const peerConnection =
                peerConnectionRef.current;

            if (!peerConnection) {
                return;
            }

            try {
                await peerConnection.setRemoteDescription(
                    answer,
                );

                await flushPendingIceCandidates();
            } catch (error) {
                console.error(
                    "Could not handle voice answer:",
                    error,
                );

                setVoiceStatus("error");
            }
        };

        const handleIceCandidate = async (
            candidate: RTCIceCandidateInit,
        ) => {
            const peerConnection =
                peerConnectionRef.current;

            if (!peerConnection) {
                pendingIceCandidatesRef.current.push(
                    candidate,
                );
                return;
            }

            if (!peerConnection.remoteDescription) {
                pendingIceCandidatesRef.current.push(
                    candidate,
                );
                return;
            }

            try {
                await peerConnection.addIceCandidate(
                    candidate,
                );
            } catch (error) {
                console.error(
                    "Could not add ICE candidate:",
                    error,
                );
            }
        };

        const handleVoiceUserLeft = () => {
            cleanupVoice();
        };

        socket.on(
            "voice-offer",
            handleVoiceOffer,
        );

        socket.on(
            "voice-answer",
            handleVoiceAnswer,
        );

        socket.on(
            "voice-ice-candidate",
            handleIceCandidate,
        );

        socket.on(
            "voice-user-left",
            handleVoiceUserLeft,
        );

        return () => {
            socket.off(
                "voice-offer",
                handleVoiceOffer,
            );

            socket.off(
                "voice-answer",
                handleVoiceAnswer,
            );

            socket.off(
                "voice-ice-candidate",
                handleIceCandidate,
            );

            socket.off(
                "voice-user-left",
                handleVoiceUserLeft,
            );

            cleanupVoice();
        };
    }, [role]);

    return {
        remoteAudioRef,
        voiceStatus,
        isMuted,
        joinVoice,
        toggleMute,
        leaveVoice,
    };
}