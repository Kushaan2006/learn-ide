import { useEffect, useRef, useState } from "react";

import AgoraRTC, {
    type IAgoraRTCClient,
    type IMicrophoneAudioTrack,
    type UID,
} from "agora-rtc-sdk-ng";

type VoiceStatus =
    | "idle"
    | "joining"
    | "connected"
    | "error";

interface UseAgoraVoiceOptions {
    roomId: string;
    role: "teacher" | "student";
}

export function useAgoraVoice({
    roomId,
    role,
}: UseAgoraVoiceOptions) {
    const rtcClientRef =
        useRef<IAgoraRTCClient | null>(null);

    const localAudioTrackRef =
        useRef<IMicrophoneAudioTrack | null>(
            null,
        );

    const [voiceStatus, setVoiceStatus] =
        useState<VoiceStatus>("idle");

    const [isMuted, setIsMuted] =
        useState(false);

    const appId =
        import.meta.env
            .AGORA_RTC_APP_ID;

    const token: string | null = null;

    const channelName =
        roomId.trim().toUpperCase();

    const rtcUid: UID =
        role === "teacher" ? 1 : 2;

    const createRtcClient = () => {
        if (rtcClientRef.current) {
            return rtcClientRef.current;
        }

        const rtcClient =
            AgoraRTC.createClient({
                mode: "rtc",
                codec: "vp8",
            });

        //when another user publishes audio
        rtcClient.on(
            "user-published",
            async (user, mediaType) => {
                await rtcClient.subscribe(
                    user,
                    mediaType,
                );

                if (
                    mediaType === "audio" &&
                    user.audioTrack
                ) {
                    user.audioTrack.play();
                }
            },
        );

        //when another user stops publishing audio
        rtcClient.on(
            "user-unpublished",
            (user, mediaType) => {
                if (
                    mediaType === "audio" &&
                    user.audioTrack
                ) {
                    user.audioTrack.stop();
                }
            },
        );

        rtcClient.on(
            "user-left",
            (user) => {
                console.log(
                    `Agora user left: ${user.uid}`,
                );
            },
        );

        rtcClient.on(
            "connection-state-change",
            (
                currentState,
                previousState,
                reason,
            ) => {
                console.log(
                    "Agora connection state:",
                    {
                        previousState,
                        currentState,
                        reason,
                    },
                );
            },
        );

        rtcClientRef.current =
            rtcClient;

        return rtcClient;
    };

    const joinVoice = async () => {
        if (
            voiceStatus === "joining" ||
            voiceStatus === "connected"
        ) {
            return;
        }

        try {
            if (!appId) {
                throw new Error(
                    "Agora App ID is missing.",
                );
            }

            setVoiceStatus("joining");

            const rtcClient =
                createRtcClient();

            //join the agora channel
            await rtcClient.join(
                appId,
                channelName,
                token,
                rtcUid,
            );

            //create microphone audio track
            const localAudioTrack =
                await AgoraRTC.createMicrophoneAudioTrack();

            localAudioTrackRef.current =
                localAudioTrack;

            //publish microphone audio
            await rtcClient.publish(
                localAudioTrack,
            );

            setIsMuted(false);
            setVoiceStatus("connected");

            console.log(
                `Joined Agora channel ${channelName}`,
            );
        } catch (error) {
            console.error(
                "Could not join Agora voice:",
                error,
            );

            localAudioTrackRef.current?.close();

            localAudioTrackRef.current =
                null;

            if (
                rtcClientRef.current &&
                rtcClientRef.current
                    .connectionState !==
                "DISCONNECTED"
            ) {
                await rtcClientRef.current.leave();
            }

            setVoiceStatus("error");
        }
    };

    const toggleMute = async () => {
        const localAudioTrack =
            localAudioTrackRef.current;

        if (!localAudioTrack) {
            return;
        }

        const nextMutedState =
            !isMuted;

        await localAudioTrack.setEnabled(
            !nextMutedState,
        );

        setIsMuted(nextMutedState);
    };

    const leaveVoice = async () => {
        const rtcClient =
            rtcClientRef.current;

        const localAudioTrack =
            localAudioTrackRef.current;

        try {
            if (
                rtcClient &&
                localAudioTrack
            ) {
                await rtcClient.unpublish(
                    localAudioTrack,
                );
            }

            localAudioTrack?.stop();
            localAudioTrack?.close();

            localAudioTrackRef.current =
                null;

            if (
                rtcClient &&
                rtcClient.connectionState !==
                "DISCONNECTED"
            ) {
                await rtcClient.leave();
            }

            setIsMuted(false);
            setVoiceStatus("idle");

            console.log(
                `Left Agora channel ${channelName}`,
            );
        } catch (error) {
            console.error(
                "Could not leave Agora voice:",
                error,
            );
        }
    };

    useEffect(() => {
        return () => {
            localAudioTrackRef.current?.stop();

            localAudioTrackRef.current?.close();

            localAudioTrackRef.current =
                null;

            if (
                rtcClientRef.current &&
                rtcClientRef.current
                    .connectionState !==
                "DISCONNECTED"
            ) {
                rtcClientRef.current.leave();
            }

            rtcClientRef.current
                ?.removeAllListeners();

            rtcClientRef.current =
                null;
        };
    }, []);

    return {
        voiceStatus,
        isMuted,
        joinVoice,
        toggleMute,
        leaveVoice,
    };
}