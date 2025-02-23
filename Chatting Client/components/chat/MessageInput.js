// components/chat/MessageInput.jsx
'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
  editMessage,
  sendMessage,
} from '@/redux/features/messages/messageSlice';
import { useSocket } from '@/context/SocketContext';
import MessageInputUI from './MessageInputUI';
import { FileIcon, ImageIcon } from 'lucide-react';
const MAX_FILE_SIZE = 25 * 1024 * 1024;
const MAX_FILES = 5;

const MessageInput = ({ chatId }) => {
  const dispatch = useDispatch();
  const [messageText, setMessageText] = useState('');
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
      const selectedFiles = Array.from(e.target.files || []);
      setFileError('');

      if (files.length + selectedFiles.length > MAX_FILES) {
        setFileError(`Maximum ${MAX_FILES} files allowed`);
        return;
      }

      const validFiles = selectedFiles.filter(validateFile);

      const newFiles = validFiles.map(file => {
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
        return updated;
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [files]
  );

  const removeFile = useCallback(index => {
    setFiles(prev => {
      const updated = prev.filter((_, i) => i !== index);
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
  const handleAudioRecordingComplete = useCallback(audioBlob => {
    try {
      const audioUrl = URL.createObjectURL(audioBlob);
      console.log('Audio URL created:', audioUrl);

      setAudioURL(audioUrl);

      // Create a unique filename for the voice message
      const filename = `voice-message-${Date.now()}.mp3`;

      // Create the file object directly from the blob
      const audioFile = new Blob([audioBlob], { type: 'audio/mp3' });

      // Add to files state with proper structure
      setFiles(prev => [
        ...prev,
        {
          file: audioFile,
          type: 'audio',
          preview: audioUrl,
          name: filename,
          size: audioFile.size,
        },
      ]);
    } catch (error) {
      console.error('Error processing audio recording:', error);
      setFileError('Failed to process audio recording');
    }
  }, []);

  const startRecording = async () => {
    try {
      console.log('Starting recording...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: 'audio/mp3',
        });
        handleAudioRecordingComplete(audioBlob);
        // const audioUrl = URL.createObjectURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(1000);
      setIsRecording(true);

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
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      setRecordingTime(0);
    }
  };

  const getFileIcon = useCallback(fileType => {
    if (fileType.startsWith('image/')) {
      return <ImageIcon className="h-6 w-6" />;
    }
    return <FileIcon className="h-6 w-6" />;
  }, []);

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
          files.forEach((fileObj, index) => {
            const { file, type } = fileObj;
            const fieldName =
              type === 'image'
                ? 'images'
                : type === 'audio' || type === 'video'
                ? 'media'
                : 'doc';
            formData.append(fieldName, file);
          });
        }
        if (editingMessage) {
          const editFormData = new FormData();
          editFormData.append('messageId', editingMessage.id);
          editFormData.append('content', messageText.trim());
          dispatch(editMessage({ formData: editFormData, socket }));
        } else {
          const result = await dispatch(
            sendMessage({ formData, socket })
          ).unwrap();
          // socketSendMessage({ formData, socket });
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
      // handleTyping={handleTyping}
      chatId={chatId}
      textareaRef={textareaRef}
      fileInputRef={fileInputRef}
      isSending={isSending}
      handleEmojiClick={handleEmojiClick}
      cancelReplyOrEdit={cancelReplyOrEdit}
    />
  );
};

export default MessageInput;
