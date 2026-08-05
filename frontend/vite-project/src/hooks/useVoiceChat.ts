import { useEffect, useRef, useState } from "react";
import { socket } from "../services/socket";

type VoiceStatus =
    | "idle"
    | "joining"
    | "connecting"
    | "connected"
    | "error";

interface UseVoiceChatOptions {
    role: "teacher" | "student";
}

export function useVoiceChat({ role }: UseVoiceChatOptions) {
    const localStreamRef = useRef<MediaStream | null>(null);

    const peerConnectionRef =
        useRef<RTCPeerConnection | null>(null);

    const remoteAudioRef =
        useRef<HTMLAudioElement | null>(null);

    const pendingIceCandidatesRef =
        useRef<RTCIceCandidateInit[]>([]);

    const [voiceStatus, setVoiceStatus] =
        useState<VoiceStatus>("idle");

    const [isMuted, setIsMuted] = useState(false);

    const logPeerConnectionDetails = (
        peerConnection: RTCPeerConnection,
    ) => {
        console.log("Peer connection details", {
            connectionState:
                peerConnection.connectionState,

            iceConnectionState:
                peerConnection.iceConnectionState,

            iceGatheringState:
                peerConnection.iceGatheringState,

            signalingState:
                peerConnection.signalingState,
        });
    };

    const createPeerConnection = () => {
        if (peerConnectionRef.current) {
            console.log(
                "Reusing existing peer connection",
            );

            return peerConnectionRef.current;
        }

        console.log("Creating new peer connection", {
            role,

            turnUsernamePresent: Boolean(
                import.meta.env
                    .VITE_TURN_SERVER_USERNAME,
            ),

            turnPasswordPresent: Boolean(
                import.meta.env
                    .VITE_TURN_SERVER_PASSWORD,
            ),
        });

        const peerConnection =
            new RTCPeerConnection({
                // Keep this as "relay" while testing Coturn.
                // Change to "all" after TURN is confirmed.
                iceTransportPolicy: "relay",

                iceServers: [
                    {
                        urls:
                            "stun:stun.l.google.com:19302",
                    },

                    {
                        urls: [
                            "turn:learn-ide-turn-kushaan.publicvm.com:3478?transport=udp",
                            "turn:learn-ide-turn-kushaan.publicvm.com:3478?transport=tcp",
                        ],

                        username:
                            import.meta.env
                                .VITE_TURN_SERVER_USERNAME,

                        credential:
                            import.meta.env
                                .VITE_TURN_SERVER_PASSWORD,
                    },
                ],
            });

        peerConnection.onicecandidate = (
            event,
        ) => {
            if (!event.candidate) {
                console.log(
                    "ICE candidate gathering completed",
                );

                return;
            }

            console.log(
                "Local ICE candidate generated",
                {
                    type: event.candidate.type,
                    protocol:
                        event.candidate.protocol,
                    address:
                        event.candidate.address,
                    port: event.candidate.port,

                    relatedAddress:
                        event.candidate.relatedAddress,

                    relatedPort:
                        event.candidate.relatedPort,

                    candidate:
                        event.candidate.candidate,
                },
            );

            socket.emit(
                "voice-ice-candidate",
                event.candidate.toJSON(),
            );

            console.log(
                "Local ICE candidate sent through Socket.IO",
            );
        };

        peerConnection.onicecandidateerror = (
            event,
        ) => {
            console.error("ICE candidate error", {
                url: event.url,
                address: event.address,
                port: event.port,
                errorCode: event.errorCode,
                errorText: event.errorText,
            });
        };

        peerConnection.onicegatheringstatechange =
            () => {
                console.log(
                    "ICE gathering state changed",
                    {
                        state:
                            peerConnection.iceGatheringState,
                    },
                );
            };

        peerConnection.oniceconnectionstatechange =
            () => {
                console.log(
                    "ICE connection state changed",
                    {
                        state:
                            peerConnection.iceConnectionState,
                    },
                );

                logPeerConnectionDetails(
                    peerConnection,
                );
            };

        peerConnection.onsignalingstatechange =
            () => {
                console.log(
                    "WebRTC signaling state changed",
                    {
                        state:
                            peerConnection.signalingState,
                    },
                );
            };

        peerConnection.onconnectionstatechange =
            () => {
                const state =
                    peerConnection.connectionState;

                console.log(
                    "Peer connection state changed",
                    {
                        state,
                    },
                );

                logPeerConnectionDetails(
                    peerConnection,
                );

                if (state === "connected") {
                    console.log(
                        "WebRTC peer connection established",
                    );

                    console.log(
                        "Current RTP senders",
                        peerConnection
                            .getSenders()
                            .map((sender) => ({
                                kind:
                                    sender.track?.kind,

                                enabled:
                                    sender.track?.enabled,

                                muted:
                                    sender.track?.muted,

                                readyState:
                                    sender.track?.readyState,

                                label:
                                    sender.track?.label,
                            })),
                    );

                    console.log(
                        "Current RTP receivers",
                        peerConnection
                            .getReceivers()
                            .map((receiver) => ({
                                kind:
                                    receiver.track?.kind,

                                enabled:
                                    receiver.track?.enabled,

                                muted:
                                    receiver.track?.muted,

                                readyState:
                                    receiver.track?.readyState,

                                label:
                                    receiver.track?.label,
                            })),
                    );

                    setVoiceStatus("connected");
                }

                if (
                    state === "failed" ||
                    state === "disconnected"
                ) {
                    console.error(
                        "WebRTC peer connection failed or disconnected",
                        {
                            state,
                        },
                    );

                    setVoiceStatus("error");
                }

                if (state === "closed") {
                    console.log(
                        "WebRTC peer connection closed",
                    );

                    setVoiceStatus("idle");
                }
            };

        peerConnection.ontrack = async (
            event,
        ) => {
            console.log("Remote track received", {
                kind: event.track.kind,
                label: event.track.label,
                enabled: event.track.enabled,
                muted: event.track.muted,
                readyState: event.track.readyState,
                streamCount: event.streams.length,
            });

            const remoteStream =
                event.streams[0] ??
                new MediaStream([event.track]);

            const audioElement =
                remoteAudioRef.current;

            if (!audioElement) {
                console.error(
                    "Remote audio element is not mounted",
                );

                return;
            }

            audioElement.srcObject =
                remoteStream;

            audioElement.muted = false;
            audioElement.volume = 1;

            console.log(
                "Remote stream assigned to audio element",
                {
                    streamId: remoteStream.id,

                    audioTrackCount:
                        remoteStream
                            .getAudioTracks()
                            .length,
                },
            );

            try {
                await audioElement.play();

                console.log(
                    "Remote audio playback started",
                );
            } catch (error) {
                console.error(
                    "Remote audio playback failed",
                    error,
                );
            }
        };

        peerConnectionRef.current =
            peerConnection;

        return peerConnection;
    };

    const startMicrophone = async () => {
        if (localStreamRef.current) {
            console.log(
                "Reusing existing microphone stream",
            );

            return localStreamRef.current;
        }

        console.log(
            "Requesting microphone access",
        );

        const stream =
            await navigator.mediaDevices.getUserMedia({
                audio: true,
            });

        console.log(
            "Microphone access granted",
            {
                streamId: stream.id,

                audioTracks:
                    stream
                        .getAudioTracks()
                        .map((track) => ({
                            id: track.id,
                            label: track.label,
                            enabled: track.enabled,
                            muted: track.muted,
                            readyState:
                                track.readyState,
                        })),
            },
        );

        localStreamRef.current = stream;

        return stream;
    };

    const addMicrophoneTracks = (
        peerConnection: RTCPeerConnection,
        stream: MediaStream,
    ) => {
        const existingSenders =
            peerConnection.getSenders();

        stream
            .getAudioTracks()
            .forEach((track) => {
                const alreadyAdded =
                    existingSenders.some(
                        (sender) =>
                            sender.track === track,
                    );

                if (alreadyAdded) {
                    console.log(
                        "Microphone track already added",
                        {
                            trackId: track.id,
                            label: track.label,
                        },
                    );

                    return;
                }

                const sender =
                    peerConnection.addTrack(
                        track,
                        stream,
                    );

                console.log(
                    "Microphone track added to peer connection",
                    {
                        trackId: track.id,
                        label: track.label,
                        enabled: track.enabled,
                        muted: track.muted,
                        readyState: track.readyState,

                        senderTrackKind:
                            sender.track?.kind,
                    },
                );
            });
    };

    const flushPendingIceCandidates =
        async () => {
            const peerConnection =
                peerConnectionRef.current;

            if (!peerConnection) {
                console.warn(
                    "Cannot flush ICE candidates because no peer connection exists",
                );

                return;
            }

            console.log(
                "Flushing pending ICE candidates",
                {
                    count:
                        pendingIceCandidatesRef
                            .current.length,
                },
            );

            for (
                const candidateInit of
                pendingIceCandidatesRef.current
            ) {
                try {
                    const parsedCandidate =
                        new RTCIceCandidate(
                            candidateInit,
                        );

                    await peerConnection.addIceCandidate(
                        parsedCandidate,
                    );

                    console.log(
                        "Pending ICE candidate added",
                        {
                            type:
                                parsedCandidate.type,

                            protocol:
                                parsedCandidate.protocol,

                            address:
                                parsedCandidate.address,

                            port:
                                parsedCandidate.port,

                            candidate:
                                parsedCandidate.candidate,
                        },
                    );
                } catch (error) {
                    console.error(
                        "Failed to add pending ICE candidate",
                        {
                            candidate:
                                candidateInit,

                            error,
                        },
                    );
                }
            }

            pendingIceCandidatesRef.current =
                [];
        };

    const joinVoice = async () => {
        if (
            voiceStatus === "joining" ||
            voiceStatus === "connecting" ||
            voiceStatus === "connected"
        ) {
            console.warn(
                "Join voice ignored because voice is already active",
                {
                    voiceStatus,
                },
            );

            return;
        }

        try {
            console.log(
                "Joining voice chat",
                {
                    role,
                },
            );

            setVoiceStatus("joining");

            const stream =
                await startMicrophone();

            const peerConnection =
                createPeerConnection();

            addMicrophoneTracks(
                peerConnection,
                stream,
            );

            setVoiceStatus("connecting");

            if (role === "teacher") {
                console.log(
                    "Teacher creating WebRTC offer",
                );

                const offer =
                    await peerConnection.createOffer();

                console.log(
                    "WebRTC offer created",
                    {
                        type: offer.type,

                        sdpLength:
                            offer.sdp?.length ?? 0,
                    },
                );

                await peerConnection.setLocalDescription(
                    offer,
                );

                console.log(
                    "Local offer description set",
                );

                socket.emit(
                    "voice-offer",
                    peerConnection.localDescription,
                );

                console.log(
                    "Voice offer sent through Socket.IO",
                );
            } else {
                console.log(
                    "Student is waiting for teacher offer",
                );
            }
        } catch (error) {
            console.error(
                "Could not join voice",
                error,
            );

            setVoiceStatus("error");
        }
    };

    const toggleMute = () => {
        const stream =
            localStreamRef.current;

        if (!stream) {
            console.warn(
                "Mute toggle ignored because microphone stream is unavailable",
            );

            return;
        }

        const nextMutedState =
            !isMuted;

        stream
            .getAudioTracks()
            .forEach((track) => {
                track.enabled =
                    !nextMutedState;

                console.log(
                    "Microphone track mute state changed",
                    {
                        trackId: track.id,
                        enabled: track.enabled,

                        mutedByApplication:
                            nextMutedState,
                    },
                );
            });

        setIsMuted(nextMutedState);
    };

    const cleanupVoice = () => {
        console.log(
            "Cleaning up voice chat",
        );

        localStreamRef.current
            ?.getTracks()
            .forEach((track) => {
                console.log(
                    "Stopping local media track",
                    {
                        id: track.id,
                        kind: track.kind,
                    },
                );

                track.stop();
            });

        localStreamRef.current = null;

        if (
            peerConnectionRef.current
        ) {
            console.log(
                "Closing peer connection",
            );

            peerConnectionRef.current.close();

            peerConnectionRef.current =
                null;
        }

        pendingIceCandidatesRef.current =
            [];

        if (remoteAudioRef.current) {
            remoteAudioRef.current.pause();

            remoteAudioRef.current.srcObject =
                null;
        }

        setIsMuted(false);
        setVoiceStatus("idle");
    };

    const leaveVoice = () => {
        console.log(
            "Leaving voice chat",
        );

        socket.emit("voice-leave");

        cleanupVoice();
    };

    useEffect(() => {
        const handleVoiceOffer = async (
            offer: RTCSessionDescriptionInit,
        ) => {
            console.log(
                "Voice offer received",
                {
                    type: offer.type,

                    sdpLength:
                        offer.sdp?.length ?? 0,
                },
            );

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

                console.log(
                    "Remote offer description set",
                );

                await flushPendingIceCandidates();

                console.log(
                    "Creating WebRTC answer",
                );

                const answer =
                    await peerConnection.createAnswer();

                console.log(
                    "WebRTC answer created",
                    {
                        type: answer.type,

                        sdpLength:
                            answer.sdp?.length ?? 0,
                    },
                );

                await peerConnection.setLocalDescription(
                    answer,
                );

                console.log(
                    "Local answer description set",
                );

                socket.emit(
                    "voice-answer",
                    peerConnection.localDescription,
                );

                console.log(
                    "Voice answer sent through Socket.IO",
                );
            } catch (error) {
                console.error(
                    "Could not handle voice offer",
                    error,
                );

                setVoiceStatus("error");
            }
        };

        const handleVoiceAnswer = async (
            answer: RTCSessionDescriptionInit,
        ) => {
            console.log(
                "Voice answer received",
                {
                    type: answer.type,

                    sdpLength:
                        answer.sdp?.length ?? 0,
                },
            );

            const peerConnection =
                peerConnectionRef.current;

            if (!peerConnection) {
                console.error(
                    "Voice answer received before peer connection was created",
                );

                return;
            }

            try {
                await peerConnection.setRemoteDescription(
                    answer,
                );

                console.log(
                    "Remote answer description set",
                );

                await flushPendingIceCandidates();
            } catch (error) {
                console.error(
                    "Could not handle voice answer",
                    error,
                );

                setVoiceStatus("error");
            }
        };

        const handleIceCandidate = async (
            candidateInit: RTCIceCandidateInit,
        ) => {
            const parsedCandidate =
                new RTCIceCandidate(
                    candidateInit,
                );

            console.log(
                "Remote ICE candidate received",
                {
                    type: parsedCandidate.type,

                    protocol:
                        parsedCandidate.protocol,

                    address:
                        parsedCandidate.address,

                    port:
                        parsedCandidate.port,

                    candidate:
                        parsedCandidate.candidate,
                },
            );

            const peerConnection =
                peerConnectionRef.current;

            if (!peerConnection) {
                console.log(
                    "Queueing remote ICE candidate because peer connection does not exist yet",
                );

                pendingIceCandidatesRef.current.push(
                    candidateInit,
                );

                return;
            }

            if (
                !peerConnection.remoteDescription
            ) {
                console.log(
                    "Queueing remote ICE candidate because remote description is not set",
                );

                pendingIceCandidatesRef.current.push(
                    candidateInit,
                );

                return;
            }

            try {
                await peerConnection.addIceCandidate(
                    parsedCandidate,
                );

                console.log(
                    "Remote ICE candidate added successfully",
                    {
                        type:
                            parsedCandidate.type,

                        protocol:
                            parsedCandidate.protocol,

                        address:
                            parsedCandidate.address,

                        port:
                            parsedCandidate.port,
                    },
                );
            } catch (error) {
                console.error(
                    "Could not add remote ICE candidate",
                    {
                        candidate:
                            candidateInit,

                        error,
                    },
                );
            }
        };

        const handleVoiceUserLeft = () => {
            console.log(
                "Remote user left voice chat",
            );

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

        console.log(
            "Voice Socket.IO listeners registered",
            {
                role,
            },
        );

        return () => {
            console.log(
                "Removing voice Socket.IO listeners",
                {
                    role,
                },
            );

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