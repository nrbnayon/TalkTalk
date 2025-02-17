// components/call/IncomingCallDialog.js
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Phone, Video, PhoneOff } from "lucide-react";
import { useCallHandler } from "@/hooks/useCallHandler";

const IncomingCallDialog = () => {
  const { incomingCall, answerCall, rejectCall } = useCallHandler();

  if (!incomingCall) return null;

  const caller = incomingCall.participants.find(
    (p) => p._id !== incomingCall.receiver
  );

  return (
    <Dialog
      open={!!incomingCall}
      onOpenChange={() => rejectCall(incomingCall._id)}
    >
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='text-center'>
            Incoming {incomingCall.callType} Call
          </DialogTitle>
        </DialogHeader>

        <div className='flex flex-col items-center py-6'>
          <Avatar className='h-24 w-24 mb-4' src={caller?.image}>
            {caller?.name?.substring(0, 2)}
          </Avatar>
          <h3 className='text-xl font-semibold mb-1'>{caller?.name}</h3>
          <p className='text-gray-500 mb-6'>is calling you...</p>

          <div className='flex gap-4'>
            <Button
              onClick={() => rejectCall(incomingCall._id)}
              size='lg'
              variant='outline'
              className='rounded-full h-14 w-14 flex items-center justify-center bg-red-100 hover:bg-red-200'
            >
              <PhoneOff className='h-6 w-6 text-red-500' />
            </Button>

            <Button
              onClick={answerCall}
              size='lg'
              className='rounded-full h-14 w-14 flex items-center justify-center bg-green-500 hover:bg-green-600'
            >
              {incomingCall.callType === "audio" ? (
                <Phone className='h-6 w-6 text-white' />
              ) : (
                <Video className='h-6 w-6 text-white' />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IncomingCallDialog;
