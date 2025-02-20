// components/chat/MessageInputUI.js
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Send,
  Paperclip,
  Mic,
  ImageIcon,
  Smile,
  X,
  StopCircle,
  AlertCircle,
  Reply,
} from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Image from 'next/image';
import { DialogDescription } from '@radix-ui/react-dialog';

const MessageInputUI = ({
  messageText,
  setMessageText,
  files,
  setFiles,
  fileError,
  setFileError,
  replyingTo,
  setReplyingTo,
  editingMessage,
  setEditingMessage,
  showEmojiPicker,
  setShowEmojiPicker,
  isRecording,
  setIsRecording,
  recordingTime,
  setRecordingTime,
  audioURL,
  setAudioURL,
  showVoiceModal,
  setShowVoiceModal,
  handleFileSelect,
  removeFile,
  formatFileSize,
  getFileIcon,
  startRecording,
  stopRecording,
  formatTime,
  handleSendMessage,
  handleTyping,
  textareaRef,
  fileInputRef,
}) => {
  const ReplyPreview = () => {
    if (!replyingTo) return null;

    return (
      <div className="px-4 py-2 border-t bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Reply className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">
              Replying to {replyingTo.sender.name}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setReplyingTo(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-gray-600 mt-1 line-clamp-1">
          {replyingTo.content}
        </p>
      </div>
    );
  };

  return (
    <div className="border-t bg-white">
      {fileError && (
        <Alert variant="destructive" className="m-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{fileError}</AlertDescription>
        </Alert>
      )}

      {/* File Previews */}
      {files.length > 0 && (
        <div className="px-4 py-1 border-b">
          <div className="flex gap-2 overflow-x-auto">
            {files.map((fileObj, index) => (
              <div key={index} className="relative group min-w-24">
                {fileObj.type === 'image' ? (
                  <Dialog>
                    <DialogTrigger>
                      <div className="relative w-24 h-24 rounded overflow-hidden border">
                        <Image
                          src={fileObj.preview}
                          alt={fileObj.name}
                          width={1000}
                          height={1000}
                          priority
                          className="object-cover h-full"
                        />
                      </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl bg-white p-4">
                      <DialogHeader className="border-b border-gray-200 p-4">
                        <DialogTitle>{fileObj.name}</DialogTitle>
                        <DialogDescription className="hidden">
                          This is a description of the dialog.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="bg-gray-200 flex items-center justify-center rounded-lg shadow-md">
                        <Image
                          src={fileObj.preview}
                          alt={fileObj.name}
                          width={800}
                          height={500}
                          className="object-contain"
                        />
                      </div>
                    </DialogContent>
                  </Dialog>
                ) : fileObj.type === 'audio' ? (
                  <div className="p-2 border rounded bg-white shadow-sm">
                    <audio
                      src={fileObj.preview}
                      controls
                      className="w-[200px]"
                    />
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {fileObj.name}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 border rounded bg-white shadow-sm">
                    {getFileIcon(fileObj.file.type)}
                    <div className="flex flex-col">
                      <span className="text-sm truncate max-w-[150px]">
                        {fileObj.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatFileSize(fileObj.size)}
                      </span>
                    </div>
                  </div>
                )}
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-0 right-0 border hover:border-2 border-red-400 rounded-full hover:bg-gray-100 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-3 w-3 text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reply preview */}
      <ReplyPreview />

      {/* Edit indicator */}
      {editingMessage && (
        <div className="px-4 py-2 bg-blue-50 flex items-center justify-between">
          <span className="text-sm text-blue-600">Editing message</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditingMessage(null);
              setMessageText('');
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Message Input Form */}
      <form onSubmit={handleSendMessage} className="p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="w-[5%]">
            <input
              type="file"
              onClick={() => fileInputRef.current?.click()}
              multiple
              className="hidden"
              accept="image/*,video/*,audio/*,application/pdf,.doc,.docx,.txt,.xls,.xlsx,.zip,.rar"
            />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-5 w-5 text-gray-500" />
            </Button>
          </div>

          <div className="w-full">
            <Textarea
              ref={textareaRef}
              value={messageText}
              onChange={e => {
                setMessageText(e.target.value);
                handleTyping();
              }}
              placeholder={
                editingMessage ? 'Edit your message...' : 'Type a message...'
              }
              className="min-h-10 max-h-[150px] resize-none w-full"
              rows={1}
            />
          </div>

          <div className="w-[20%] flex justify-between items-center relative">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.accept = 'image/*';
                  fileInputRef.current.click();
                }
              }}
            >
              <ImageIcon className="h-5 w-5 text-gray-500" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowVoiceModal(true)}
              className="hover:bg-gray-100"
            >
              <Mic className="h-5 w-5 text-gray-500" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Smile className="h-5 w-5 text-gray-500" />
            </Button>
            {showEmojiPicker && (
              <div className="absolute bottom-full right-0 mb-2 z-50">
                <EmojiPicker
                  onEmojiClick={emojiObject => {
                    setMessageText(prev => prev + emojiObject.emoji);
                    setShowEmojiPicker(false);
                  }}
                />
              </div>
            )}
            <Button
              type="submit"
              disabled={!messageText.trim() && files.length === 0}
              className="bg-blue-500 hover:bg-blue-600"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </form>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        multiple
        className="hidden"
        accept="image/*,video/*,audio/*,application/pdf,.doc,.docx,.txt,.xls,.xlsx,.zip,.rar"
      />

      {/* Voice Recording Modal */}
      <Dialog open={showVoiceModal} onOpenChange={setShowVoiceModal}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Voice Message</DialogTitle>
            <DialogDescription className="hidden">
              This is a description of the dialog.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 p-4">
            {isRecording ? (
              <div className="flex flex-col items-center gap-2">
                <div className="text-red-500 animate-pulse">Recording...</div>
                <div className="text-lg font-mono">
                  {formatTime(recordingTime)}
                </div>
                <Button onClick={stopRecording} variant="destructive">
                  <StopCircle className="h-6 w-6" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                {audioURL ? (
                  <>
                    <audio src={audioURL} controls className="w-full" />
                    <Button onClick={() => setAudioURL(null)}>
                      Record Again
                    </Button>
                  </>
                ) : (
                  <Button onClick={startRecording} className="shadow-xl">
                    <Mic className="h-6 w-6 mr-2" />
                    Start Recording
                  </Button>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setShowVoiceModal(false);
                setAudioURL(null);
                setIsRecording(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowVoiceModal(false);
              }}
              disabled={!audioURL}
            >
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-full right-0 mb-2 z-50">
          <div className="relative">
            <Button
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
              size="icon"
              variant="secondary"
              onClick={() => setShowEmojiPicker(false)}
            >
              <X className="h-4 w-4" />
            </Button>
            <EmojiPicker
              onEmojiClick={emojiObject => {
                setMessageText(prev => prev + emojiObject.emoji);
                setShowEmojiPicker(false);
              }}
              width={350}
              height={400}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageInputUI;
