// hooks/useCallHandler.js
import { useEffect, useCallback, useState, useRef } from 'react';
import { useSocket } from '../context/SocketContext';

const CALL_CLEANUP_TIMEOUT = 3000;

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

  const [callStatus, setCallStatus] = useState('idle');
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});

  const cleanupTimeoutRef = useRef(null);

  // Handle media stream cleanup
  const cleanupMediaStream = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    setRemoteStreams({});
  }, [localStream]);

  // Handle call status changes
  useEffect(() => {
    if (incomingCall) {
      setCallStatus('ringing');
    } else if (currentCall) {
      setCallStatus(currentCall.status);

      if (['ended', 'rejected'].includes(currentCall.status)) {
        cleanupMediaStream();

        clearTimeout(cleanupTimeoutRef.current);
        cleanupTimeoutRef.current = setTimeout(() => {
          setCallStatus('idle');
        }, CALL_CLEANUP_TIMEOUT);
      }
    } else {
      setCallStatus('idle');
    }

    return () => {
      clearTimeout(cleanupTimeoutRef.current);
    };
  }, [incomingCall, currentCall, cleanupMediaStream]);

  const getMediaStream = useCallback(async isVideo => {
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideo,
      });
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  }, []);

  const startCall = useCallback(
    async (chatId, participants, callType = 'video') => {
      try {
        const stream = await getMediaStream(callType === 'video');
        setLocalStream(stream);
        initiateCall(chatId, callType, participants);
        return true;
      } catch (error) {
        console.error('Error starting call:', error);
        return false;
      }
    },
    [initiateCall, getMediaStream]
  );

  const answerCall = useCallback(async () => {
    if (!incomingCall) return false;

    try {
      const stream = await getMediaStream(incomingCall.callType === 'video');
      setLocalStream(stream);
      acceptCall(incomingCall._id);
      return true;
    } catch (error) {
      console.error('Error answering call:', error);
      return false;
    }
  }, [incomingCall, acceptCall, getMediaStream]);

  const handleSignal = useCallback(
    (targetUserId, signalData) => {
      if (currentCall) {
        sendCallSignal(currentCall._id, targetUserId, signalData);
      }
    },
    [currentCall, sendCallSignal]
  );

  const addRemoteStream = useCallback((userId, stream) => {
    setRemoteStreams(prev => ({
      ...prev,
      [userId]: stream,
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupMediaStream();
      clearTimeout(cleanupTimeoutRef.current);
    };
  }, [cleanupMediaStream]);

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

// // hooks/useCallHandler.js
// import { useEffect, useCallback, useState } from "react";
// import { useSocket } from "../context/SocketContext";

// export const useCallHandler = () => {
//   const {
//     incomingCall,
//     currentCall,
//     initiateCall,
//     acceptCall,
//     rejectCall,
//     endCall,
//     sendCallSignal,
//   } = useSocket();

//   const [callStatus, setCallStatus] = useState("idle"); // idle, ringing, ongoing, ended
//   const [localStream, setLocalStream] = useState(null);
//   const [remoteStreams, setRemoteStreams] = useState({});

//   // Handle call status changes
//   useEffect(() => {
//     if (incomingCall) {
//       setCallStatus("ringing");
//     } else if (currentCall) {
//       setCallStatus(currentCall.status);

//       // Clean up when call ends
//       if (currentCall.status === "ended" || currentCall.status === "rejected") {
//         if (localStream) {
//           localStream.getTracks().forEach((track) => track.stop());
//           setLocalStream(null);
//         }

//         setRemoteStreams({});
//         setTimeout(() => setCallStatus("idle"), 3000);
//       }
//     } else {
//       setCallStatus("idle");
//     }
//   }, [incomingCall, currentCall, localStream]);

//   // Start a new call
//   const startCall = useCallback(
//     async (chatId, participants, callType = "video") => {
//       try {
//         // Get media stream
//         const constraints = {
//           audio: true,
//           video: callType === "video",
//         };

//         const stream = await navigator.mediaDevices.getUserMedia(constraints);
//         setLocalStream(stream);

//         // Initiate call
//         initiateCall(chatId, callType, participants);

//         return true;
//       } catch (error) {
//         console.error("Error starting call:", error);
//         return false;
//       }
//     },
//     [initiateCall]
//   );

//   // Answer incoming call
//   const answerCall = useCallback(async () => {
//     if (!incomingCall) return false;

//     try {
//       // Get media stream
//       const constraints = {
//         audio: true,
//         video: incomingCall.callType === "video",
//       };

//       const stream = await navigator.mediaDevices.getUserMedia(constraints);
//       setLocalStream(stream);

//       // Accept the call
//       acceptCall(incomingCall._id);

//       return true;
//     } catch (error) {
//       console.error("Error answering call:", error);
//       return false;
//     }
//   }, [incomingCall, acceptCall]);

//   // Handle WebRTC signal
//   const handleSignal = useCallback(
//     (targetUserId, signalData) => {
//       if (!currentCall) return;

//       sendCallSignal(currentCall._id, targetUserId, signalData);
//     },
//     [currentCall, sendCallSignal]
//   );

//   // Add a remote stream
//   const addRemoteStream = useCallback((userId, stream) => {
//     setRemoteStreams((prev) => ({
//       ...prev,
//       [userId]: stream,
//     }));
//   }, []);

//   return {
//     callStatus,
//     incomingCall,
//     currentCall,
//     localStream,
//     remoteStreams,
//     startCall,
//     answerCall,
//     rejectCall,
//     endCall,
//     handleSignal,
//     addRemoteStream,
//   };
// };
