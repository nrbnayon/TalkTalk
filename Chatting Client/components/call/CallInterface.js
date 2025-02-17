// components/call/CallInterface.js
import React, { useEffect, useRef, useState } from "react";
import { useCallHandler } from "@/hooks/useCallHandler";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Users } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const CallInterface = () => {
  const {
    currentCall,
    callStatus,
    localStream,
    remoteStreams,
    endCall,
    handleSignal,
    addRemoteStream,
  } = useCallHandler();

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const localVideoRef = useRef(null);
  const peerConnections = useRef({});

  // Set up local video stream
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Handle WebRTC connections
  useEffect(() => {
    if (!currentCall || !localStream) return;

    // Set up WebRTC for each participant
    currentCall.participants.forEach((participant) => {
      if (participant._id === currentCall.initiator) return; // Skip self

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      // Add local tracks to the connection
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          handleSignal(participant._id, {
            type: "ice-candidate",
            candidate: event.candidate,
          });
        }
      };

      // Handle remote stream
      pc.ontrack = (event) => {
        addRemoteStream(participant._id, event.streams[0]);
      };

      // Store the connection
      peerConnections.current[participant._id] = pc;

      // Create and send offer if initiator
      if (currentCall.initiator === participant._id) {
        pc.createOffer()
          .then((offer) => pc.setLocalDescription(offer))
          .then(() => {
            handleSignal(participant._id, {
              type: "offer",
              sdp: pc.localDescription,
            });
          });
      }
    });

    // Listen for WebRTC signals
    const handleWebRTCSignal = (event) => {
      const { detail } = event;
      if (!detail || !peerConnections.current[detail.senderId]) return;

      const pc = peerConnections.current[detail.senderId];

      if (detail.signal.type === "offer") {
        pc.setRemoteDescription(new RTCSessionDescription(detail.signal.sdp))
          .then(() => pc.createAnswer())
          .then((answer) => pc.setLocalDescription(answer))
          .then(() => {
            handleSignal(detail.senderId, {
              type: "answer",
              sdp: pc.localDescription,
            });
          });
      } else if (detail.signal.type === "answer") {
        pc.setRemoteDescription(new RTCSessionDescription(detail.signal.sdp));
      } else if (detail.signal.type === "ice-candidate") {
        pc.addIceCandidate(new RTCIceCandidate(detail.signal.candidate));
      }
    };

    window.addEventListener("webrtc-signal", handleWebRTCSignal);

    return () => {
      window.removeEventListener("webrtc-signal", handleWebRTCSignal);

      // Clean up peer connections
      Object.values(peerConnections.current).forEach((pc) => pc.close());
      peerConnections.current = {};
    };
  }, [currentCall, localStream, handleSignal, addRemoteStream]);

  // Toggle audio/video
  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  if (!currentCall) return null;

  const isVideoCall = currentCall.callType === "video";
  const participants = Object.keys(remoteStreams);

  return (
    <Dialog
      open={!!currentCall}
      onOpenChange={() => callStatus !== "ended" && endCall(currentCall._id)}
    >
      <DialogContent className='sm:max-w-[90vw] max-h-[90vh] p-0 overflow-hidden'>
        <div className='relative h-full w-full bg-black'>
          {/* Main video area */}
          <div
            className={`grid ${
              participants.length > 0 ? "grid-cols-2 gap-2 p-2" : ""
            } h-full`}
          >
            {/* Remote streams */}
            {participants.map((userId) => (
              <div key={userId} className='relative rounded-lg overflow-hidden'>
                <video
                  ref={(el) => {
                    if (el) el.srcObject = remoteStreams[userId];
                  }}
                  autoPlay
                  playsInline
                  className='h-full w-full object-cover'
                />
                <div className='absolute bottom-2 left-2 bg-black/50 rounded-full p-1 text-white text-sm'>
                  {currentCall.participants.find((p) => p._id === userId)?.name}
                </div>
              </div>
            ))}

            {/* If no remote streams yet, show waiting screen */}
            {participants.length === 0 && (
              <div className='flex flex-col items-center justify-center'>
                <Users className='h-16 w-16 text-white/50 mb-4' />
                <h3 className='text-white/70 text-xl'>
                  Waiting for others to join...
                </h3>
              </div>
            )}
          </div>

          {/* Local video */}
          {isVideoCall && (
            <div className='absolute bottom-20 right-4 w-1/4 max-w-[200px] rounded-lg overflow-hidden shadow-lg'>
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full object-cover ${isVideoOff ? "hidden" : ""}`}
              />
              {isVideoOff && (
                <div className='bg-gray-800 h-full w-full flex items-center justify-center'>
                  <Avatar className='h-16 w-16'>
                    {currentCall.participants
                      .find((p) => p._id === currentCall.initiator)
                      ?.name?.substring(0, 2)}
                  </Avatar>
                </div>
              )}
            </div>
          )}

          {/* Call controls */}
          <div className='absolute bottom-4 left-0 right-0 flex justify-center gap-4'>
            <Button
              onClick={toggleMute}
              size='lg'
              variant='outline'
              className={`rounded-full h-12 w-12 flex items-center justify-center ${
                isMuted
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
            >
              {isMuted ? (
                <MicOff className='h-5 w-5 text-white' />
              ) : (
                <Mic className='h-5 w-5 text-white' />
              )}
            </Button>

            {isVideoCall && (
              <Button
                onClick={toggleVideo}
                size='lg'
                variant='outline'
                className={`rounded-full h-12 w-12 flex items-center justify-center ${
                  isVideoOff
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-gray-700 hover:bg-gray-600"
                }`}
              >
                {isVideoOff ? (
                  <VideoOff className='h-5 w-5 text-white' />
                ) : (
                  <Video className='h-5 w-5 text-white' />
                )}
              </Button>
            )}

            <Button
              onClick={() => endCall(currentCall._id)}
              size='lg'
              className='rounded-full h-12 w-12 flex items-center justify-center bg-red-500 hover:bg-red-600'
            >
              <PhoneOff className='h-5 w-5 text-white' />
            </Button>
          </div>

          {/* Call status */}
          {callStatus === "initiating" && (
            <div className='absolute top-4 left-0 right-0 text-center'>
              <span className='bg-black/50 text-white px-4 py-2 rounded-full'>
                Calling...
              </span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CallInterface;
