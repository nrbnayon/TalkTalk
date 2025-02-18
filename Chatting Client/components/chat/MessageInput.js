'use client';

import React from 'react';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Send,
  Paperclip,
  Mic,
  ImageIcon,
  Smile,
  X,
  File,
  StopCircle,
  AlertCircle,
} from 'lucide-react';
import {
  sendMessage,
  updateMessage,
} from '@/redux/features/messages/messageSlice';
import { useSocket } from '@/context/SocketContext';
import { cn } from '@/lib/utils';
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

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const MAX_FILES = 5;

const MessageInput = ({ chatId }) => {
  const dispatch = useDispatch();
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editingMessage, setEditingMessage] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioURL, setAudioURL] = useState(null);
  const [fileError, setFileError] = useState('');
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const textareaRef = useRef(null);

  const { user } = useSelector(state => state.auth);
  const {
    sendMessage: socketSendMessage,
    startTyping,
    stopTyping,
  } = useSocket();
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        150
      )}px`; // Max 5 lines (approximately 150px)
    }
  }, [messageText]);

  const handleTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      startTyping(chatId);
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      stopTyping(chatId);
    }, 1000);
  }, [chatId, isTyping, startTyping, stopTyping]);

  const validateFile = file => {
    console.log('Validating file:', file.name, 'Size:', file.size);

    if (file.size > MAX_FILE_SIZE) {
      setFileError(`File ${file.name} exceeds 25MB limit`);
      return false;
    }
    return true;
  };

  const handleFileSelect = useCallback(
    e => {
      console.log('File selection started');
      const selectedFiles = Array.from(e.target.files || []);
      setFileError('');

      if (files.length + selectedFiles.length > MAX_FILES) {
        setFileError(`Maximum ${MAX_FILES} files allowed`);
        return;
      }

      const validFiles = selectedFiles.filter(validateFile);

      const newFiles = validFiles.map(file => {
        console.log('Processing file:', file.name, 'Type:', file.type);
        let preview = null;

        if (file.type.startsWith('image/')) {
          preview = URL.createObjectURL(file);
        } else if (file.type.startsWith('video/')) {
          preview = URL.createObjectURL(file);
        } else if (file.type.startsWith('audio/')) {
          preview = URL.createObjectURL(file);
        }

        return {
          file,
          type: file.type.startsWith('image/')
            ? 'image'
            : file.type.startsWith('video/')
            ? 'video'
            : file.type.startsWith('audio/')
            ? 'audio'
            : 'document',
          preview,
          name: file.name,
          size: file.size,
        };
      });

      setFiles(prev => {
        const updated = [...prev, ...newFiles].slice(0, MAX_FILES);
        console.log('Updated files:', updated);
        return updated;
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [files]
  );

  const removeFile = useCallback(index => {
    console.log('Removing file at index:', index);
    setFiles(prev => {
      const updated = prev.filter((_, i) => i !== index);
      console.log('Files after removal:', updated);
      return updated;
    });
  }, []);

  const formatFileSize = bytes => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    );
  };

  const getFileIcon = fileType => {
    if (fileType.startsWith('image/')) return <ImageIcon className="h-6 w-6" />;
    return <File className="h-6 w-6" />;
  };

  const startRecording = async () => {
    try {
      console.log('Starting recording...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          console.log('Recording data available:', event.data.size, 'bytes');
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log('Recording stopped, processing audio...');
        const audioBlob = new Blob(audioChunksRef.current, {
          type: 'audio/webm',
        });
        const audioUrl = URL.createObjectURL(audioBlob);
        console.log('Audio URL created:', audioUrl);
        setAudioURL(audioUrl);

        // Add audio to files
        setFiles(prev => [
          ...prev,
          {
            file: new File([audioBlob], `voice-message-${Date.now()}.webm`, {
              type: 'audio/webm',
            }),
            type: 'audio',
            preview: audioUrl,
          },
        ]);

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(1000); // Record in 1-second chunks
      setIsRecording(true);
      console.log('Recording started successfully');

      // Start timer
      let seconds = 0;
      recordingTimerRef.current = setInterval(() => {
        seconds++;
        setRecordingTime(seconds);
        if (seconds >= 300) {
          // 5 minutes max
          stopRecording();
        }
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      setFileError('Could not access microphone');
    }
  };

  const stopRecording = () => {
    console.log('Stopping recording...');
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      setRecordingTime(0);
    }
  };

  const formatTime = seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendMessage = useCallback(
    async e => {
      e.preventDefault();
      console.log('Sending message...');

      if (!messageText.trim() && files.length === 0) {
        console.log('No content to send');
        return;
      }

      try {
        if (editingMessage) {
          console.log('Editing message:', editingMessage);
          dispatch(updateMessage({ ...editingMessage, content: messageText }));
          setEditingMessage(null);
        } else {
          const formData = new FormData();
          formData.append('content', messageText);
          formData.append('chatId', chatId);

          if (replyingTo) {
            formData.append('replyTo', replyingTo._id);
          }

          files.forEach((fileObj, index) => {
            formData.append(`files`, fileObj.file);
            console.log(`Appending file ${index}:`, fileObj.file.name);
          });

          const messageData = {
            chatId,
            content: messageText,
            files: files.map(f => f.file.name),
          };

          await socketSendMessage(messageData);
          dispatch(sendMessage(formData));
        }

        setMessageText('');
        setFiles([]);
        setUploadProgress(0);
        setReplyingTo(null);
        setAudioURL(null);

        console.log('Message sent successfully');
      } catch (error) {
        console.error('Error sending message:', error);
      }
    },
    [
      chatId,
      dispatch,
      editingMessage,
      files,
      messageText,
      replyingTo,
      socketSendMessage,
    ]
  );

  const cancelReplyOrEdit = useCallback(() => {
    setReplyingTo(null);
    setEditingMessage(null);
    setMessageText('');
  }, []);

  const handleEmojiClick = emojiObject => {
    setMessageText(prevMessage => prevMessage + emojiObject.emoji);
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
        <div className="p-2 border-b">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {files.map((fileObj, index) => (
              <div key={index} className="relative group min-w-[100px]">
                {fileObj.type === 'image' ? (
                  <Dialog>
                    <DialogTrigger>
                      <div className="relative w-24 h-24 rounded overflow-hidden border">
                        <Image
                          src={fileObj.preview}
                          alt={fileObj.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <DialogTitle>{fileObj.name}</DialogTitle>
                      </DialogHeader>
                      <Image
                        src={fileObj.preview}
                        alt={fileObj.name}
                        width={800}
                        height={600}
                        className="object-contain"
                      />
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
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message Input Form */}

      <form onSubmit={handleSendMessage} className="p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="w-[10%]">
            <input
              type="file"
              onClick={() => fileInputRef.current?.click()}
              multiple
              className="hidden"
              accept="image/*,application/pdf,.doc,.docx,.txt"
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
              className="min-h-[40px] max-h-[150px] resize-none w-full"
              rows={1}
            />
          </div>

          <div className="md:w-[20%] flex justify-between items-center relative">
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Voice Message</DialogTitle>
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

export default MessageInput;
