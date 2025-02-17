// hooks/useCallHandler.js
import { useEffect, useCallback, useState } from "react";
import { useSocket } from "../context/SocketContext";

export const useCallHandler = () => {
  const {
    incomingCall,
    currentCall,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    sendCallSignal,
  } = useSocket();

  const [callStatus, setCallStatus] = useState("idle"); // idle, ringing, ongoing, ended
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});

  // Handle call status changes
  useEffect(() => {
    if (incomingCall) {
      setCallStatus("ringing");
    } else if (currentCall) {
      setCallStatus(currentCall.status);

      // Clean up when call ends
      if (currentCall.status === "ended" || currentCall.status === "rejected") {
        if (localStream) {
          localStream.getTracks().forEach((track) => track.stop());
          setLocalStream(null);
        }

        setRemoteStreams({});
        setTimeout(() => setCallStatus("idle"), 3000);
      }
    } else {
      setCallStatus("idle");
    }
  }, [incomingCall, currentCall, localStream]);

  // Start a new call
  const startCall = useCallback(
    async (chatId, participants, callType = "video") => {
      try {
        // Get media stream
        const constraints = {
          audio: true,
          video: callType === "video",
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        setLocalStream(stream);

        // Initiate call
        initiateCall(chatId, callType, participants);

        return true;
      } catch (error) {
        console.error("Error starting call:", error);
        return false;
      }
    },
    [initiateCall]
  );

  // Answer incoming call
  const answerCall = useCallback(async () => {
    if (!incomingCall) return false;

    try {
      // Get media stream
      const constraints = {
        audio: true,
        video: incomingCall.callType === "video",
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);

      // Accept the call
      acceptCall(incomingCall._id);

      return true;
    } catch (error) {
      console.error("Error answering call:", error);
      return false;
    }
  }, [incomingCall, acceptCall]);

  // Handle WebRTC signal
  const handleSignal = useCallback(
    (targetUserId, signalData) => {
      if (!currentCall) return;

      sendCallSignal(currentCall._id, targetUserId, signalData);
    },
    [currentCall, sendCallSignal]
  );

  // Add a remote stream
  const addRemoteStream = useCallback((userId, stream) => {
    setRemoteStreams((prev) => ({
      ...prev,
      [userId]: stream,
    }));
  }, []);

  return {
    callStatus,
    incomingCall,
    currentCall,
    localStream,
    remoteStreams,
    startCall,
    answerCall,
    rejectCall,
    endCall,
    handleSignal,
    addRemoteStream,
  };
};
