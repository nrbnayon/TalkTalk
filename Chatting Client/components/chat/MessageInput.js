// components/chat/MessageInput.jsx
'use client';

import React from 'react';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  editMessage,
  sendMessage,
} from '@/redux/features/messages/messageSlice';
import { useSocket } from '@/context/SocketContext';
import MessageInputUI from './MessageInputUI';
import { File, ImageIcon } from 'lucide-react';
import {
  prepareMessageFormData,
  validateMessageContent,
} from '@/lib/messageHelpers';

const MAX_FILE_SIZE = 25 * 1024 * 1024;
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
  const [isSending, setIsSending] = useState(false);
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
    socket,
  } = useSocket();
  const typingTimeoutRef = useRef(null);

  // Add event listeners for reply and edit
  useEffect(() => {
    const handleReplyTo = event => {
      const message = event.detail;
      setReplyingTo(message);
    };

    const handleEditMessage = event => {
      const { content } = event.detail;
      setEditingMessage(event.detail);
      setMessageText(content);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    };

    window.addEventListener('replyTo', handleReplyTo);
    window.addEventListener('editMessage', handleEditMessage);

    return () => {
      window.removeEventListener('replyTo', handleReplyTo);
      window.removeEventListener('editMessage', handleEditMessage);
    };
  }, []);

  useEffect(() => {
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        150
      )}px`;
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

      if (isSending) {
        return;
      }
      setIsSending(true);
      try {
        const formData = new FormData();

        // Add message content
        if (messageText.trim()) {
          formData.append('content', messageText.trim());
        }
        formData.append('chatId', chatId);

        // Handle reply
        if (replyingTo?._id) {
          console.log('[MessageInput] Adding reply reference:', replyingTo._id);
          formData.append('replyToId', replyingTo._id);
        }

        // Handle edit
        if (editingMessage?.id) {
          console.log(
            '[MessageInput] Adding edit reference:',
            editingMessage.id
          );
          formData.append('messageId', editingMessage.id);
        }

        // Add files
        if (files.length > 0) {
          console.log(`[MessageInput] Processing ${files.length} files`);
          files.forEach((fileObj, index) => {
            const { file, type } = fileObj;
            const fieldName =
              type === 'image'
                ? 'images'
                : type === 'audio' || type === 'video'
                ? 'media'
                : 'doc';

            console.log(`[MessageInput] Adding file ${index + 1}:`, {
              name: file.name,
              type: type,
              fieldName: fieldName,
            });

            formData.append(fieldName, file);
          });
        }

        // Dispatch the appropriate action based on whether we're editing or sending
        // const action = editingMessage ? editingMessage : sendMessage;
        if (editingMessage) {
          console.log(
            '[MessageInput] Editing message for id:',
            editingMessage.id
          );
          const editFormData = new FormData();
          editFormData.append('messageId', editingMessage.id);
          editFormData.append('content', messageText.trim());
          await dispatch(editMessage({ formData: editFormData, socket }));
        } else {
          const result = await dispatch(
            sendMessage({ formData, socket })
          ).unwrap();

          console.log('[MessageInput] Message operation successful:', result);
        }

        // Reset states
        setMessageText('');
        setFiles([]);
        setReplyingTo(null);
        setEditingMessage(null);
        setUploadProgress(0);
        setAudioURL(null);
      } catch (error) {
        console.error('[MessageInput] Error in message operation:', error);
        // Add error notification here
      } finally {
        setIsSending(false);
      }
    },
    [
      chatId,
      messageText,
      files,
      replyingTo,
      editingMessage,
      socket,
      isSending,
      dispatch,
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
    <MessageInputUI
      messageText={messageText}
      setMessageText={setMessageText}
      files={files}
      setFiles={setFiles}
      fileError={fileError}
      setFileError={setFileError}
      replyingTo={replyingTo}
      setReplyingTo={setReplyingTo}
      editingMessage={editingMessage}
      setEditingMessage={setEditingMessage}
      showEmojiPicker={showEmojiPicker}
      setShowEmojiPicker={setShowEmojiPicker}
      isRecording={isRecording}
      setIsRecording={setIsRecording}
      recordingTime={recordingTime}
      setRecordingTime={setRecordingTime}
      audioURL={audioURL}
      setAudioURL={setAudioURL}
      showVoiceModal={showVoiceModal}
      setShowVoiceModal={setShowVoiceModal}
      handleFileSelect={handleFileSelect}
      removeFile={removeFile}
      formatFileSize={formatFileSize}
      getFileIcon={getFileIcon}
      startRecording={startRecording}
      stopRecording={stopRecording}
      formatTime={formatTime}
      handleSendMessage={handleSendMessage}
      handleTyping={handleTyping}
      textareaRef={textareaRef}
      fileInputRef={fileInputRef}
      isSending={isSending}
    />
  );
};

export default MessageInput;
