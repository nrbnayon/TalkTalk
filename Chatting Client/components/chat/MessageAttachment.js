'use client';
import React, { useEffect, useRef } from 'react';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Download,
  Play,
  Pause,
  Volume2,
  File,
  ImageIcon,
  Video,
  Music,
  X,
  FileText,
  FileDown,
  FileCode,
  FileJson,
  FileSpreadsheet,
  FileArchive,
  Mail,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Slider } from '../ui/slider';

const MessageAttachment = ({ attachment }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const audioRef = useRef(null);

  const getFullUrl = url => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    if (url.startsWith('https')) return url;
    if (url.startsWith('blob:')) return url;
    return `http://localhost:4000${url}`;
  };

  const fullUrl = getFullUrl(attachment.url);

  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current;

      const onLoadedMetadata = () => {
        setDuration(audio.duration);
        setIsLoaded(true);
      };

      const onTimeUpdate = () => {
        setCurrentTime(audio.currentTime);
      };

      const onEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };

      audio.addEventListener('loadedmetadata', onLoadedMetadata);
      audio.addEventListener('timeupdate', onTimeUpdate);
      audio.addEventListener('ended', onEnded);

      return () => {
        audio.removeEventListener('loadedmetadata', onLoadedMetadata);
        audio.removeEventListener('timeupdate', onTimeUpdate);
        audio.removeEventListener('ended', onEnded);
      };
    }
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = time => {
    if (!isLoaded || isNaN(time) || !isFinite(time)) return '--:--';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const downloadFile = async () => {
    try {
      const response = await fetch(fullUrl);
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = attachment.filename;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const formatFileSize = bytes => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    );
  };

  const getFileTypeDetails = (filename, type) => {
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    const baseType = type?.toLowerCase() || '';

    const types = {
      // Images
      image: {
        icon: <ImageIcon className="h-6 w-6" />,
        color: 'bg-blue-100 text-blue-600',
      },

      // Videos
      video: {
        icon: <Video className="h-6 w-6" />,
        color: 'bg-purple-100 text-purple-600',
      },

      // Audio
      audio: {
        icon: <Music className="h-6 w-6" />,
        color: 'bg-pink-100 text-pink-600',
      },

      // Documents
      pdf: {
        icon: <FileDown className="h-6 w-6" />,
        color: 'bg-red-100 text-red-600',
      },
      doc: {
        icon: <FileText className="h-6 w-6" />,
        color: 'bg-blue-100 text-blue-600',
      },
      docx: {
        icon: <FileText className="h-6 w-6" />,
        color: 'bg-blue-100 text-blue-600',
      },
      txt: {
        icon: <FileText className="h-6 w-6" />,
        color: 'bg-gray-100 text-gray-600',
      },

      // Spreadsheets
      xlsx: {
        icon: <FileSpreadsheet className="h-6 w-6" />,
        color: 'bg-green-100 text-green-600',
      },
      xls: {
        icon: <FileSpreadsheet className="h-6 w-6" />,
        color: 'bg-green-100 text-green-600',
      },
      csv: {
        icon: <FileSpreadsheet className="h-6 w-6" />,
        color: 'bg-green-100 text-green-600',
      },

      // Code
      json: {
        icon: <FileJson className="h-6 w-6" />,
        color: 'bg-yellow-100 text-yellow-600',
      },
      js: {
        icon: <FileCode className="h-6 w-6" />,
        color: 'bg-yellow-100 text-yellow-600',
      },
      jsx: {
        icon: <FileCode className="h-6 w-6" />,
        color: 'bg-yellow-100 text-yellow-600',
      },
      ts: {
        icon: <FileCode className="h-6 w-6" />,
        color: 'bg-blue-100 text-blue-600',
      },
      tsx: {
        icon: <FileCode className="h-6 w-6" />,
        color: 'bg-blue-100 text-blue-600',
      },
      html: {
        icon: <FileCode className="h-6 w-6" />,
        color: 'bg-orange-100 text-orange-600',
      },
      css: {
        icon: <FileCode className="h-6 w-6" />,
        color: 'bg-blue-100 text-blue-600',
      },

      // Archives
      zip: {
        icon: <FileArchive className="h-6 w-6" />,
        color: 'bg-gray-100 text-gray-600',
      },
      rar: {
        icon: <FileArchive className="h-6 w-6" />,
        color: 'bg-gray-100 text-gray-600',
      },
      '7z': {
        icon: <FileArchive className="h-6 w-6" />,
        color: 'bg-gray-100 text-gray-600',
      },

      // Email
      email: {
        icon: <Mail className="h-6 w-6" />,
        color: 'bg-indigo-100 text-indigo-600',
      },
    };

    // Check if it's a base type first (image, video, audio)
    if (types[baseType]) return types[baseType];

    // Then check by extension
    if (types[extension]) return types[extension];

    // Default
    return {
      icon: <File className="h-6 w-6" />,
      color: 'bg-gray-100 text-gray-600',
    };
  };

  const renderAudioPlayer = () => {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 transition-all duration-300 hover:shadow-lg">
        <div className="flex items-center gap-4 relative">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-12 w-12 rounded-full transition-all duration-300 absolute z-10',
              'bg-blue-100 text-blue-600 hover:bg-blue-200'
            )}
            onClick={togglePlay}
          >
            {isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6" />
            )}
          </Button>
          <div className="flex-1 min-w-0 hidden">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium text-gray-700">
                {attachment.filename}
              </p>
              <span className="text-xs text-gray-500">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-blue-500 transition-all"
                style={{
                  width: `${(currentTime / duration) * 100 || 0}%`,
                }}
              />
            </div>
          </div>
          <div className=" items-center gap-2 text-black hidden">
            <Volume2 className="h-5 w-5 text-gray-400" />
            <Slider
              min={0}
              max={1}
              step={0.1}
              value={[volume]}
              onValueChange={([value]) => setVolume(value)}
              className="w-24"
            />
          </div>
          <audio
            ref={audioRef}
            src={fullUrl}
            controls
            preload="metadata"
            // className="hidden"
            className="min-w-52"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={downloadFile}
            className="ml-2 hidden"
          >
            <Download className="h-4 w-4 text-black" />
          </Button>
        </div>
      </div>
    );
  };

  const renderPreview = () => {
    const type = attachment.type?.toLowerCase();
    const fileDetails = getFileTypeDetails(attachment.filename, type);

    if (type === 'image') {
      return (
        <div className="group relative cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-white transition-all duration-300 hover:shadow-lg">
          <div onClick={() => setIsOpen(true)} className="relative w-48 h-44">
            <Image
              src={fullUrl || '/placeholder.svg'}
              alt={attachment?.filename || 'Image'}
              width={500}
              height={500}
              priority
              className="object-cover h-full"
            />
            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black/50 opacity-0 backdrop-blur-sm transition-opacity hover:opacity-100">
              <div className="flex flex-col items-center gap-2">
                <Download className="h-8 w-8 text-white" />
                <span className="text-sm font-medium text-white">Preview</span>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-200 bg-white p-3">
            <p className="truncate text-sm font-medium text-gray-700">
              {attachment.type.toUpperCase()}
            </p>
            <p className="text-xs text-gray-500">
              Size: {formatFileSize(attachment?.size)}
            </p>
          </div>
        </div>
      );
    }

    if (type === 'video') {
      return (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white transition-all duration-300 hover:shadow-lg">
          <div
            className="group relative h-[180px] w-[320px] cursor-pointer bg-gray-900"
            onClick={() => setIsOpen(true)}
          >
            <video
              className="h-full w-full object-cover"
              src={fullUrl}
              onClick={e => e.stopPropagation()}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity group-hover:opacity-80">
              <Play className="h-12 w-12 text-white transition-transform duration-300 group-hover:scale-110" />
            </div>
          </div>
          <div className="border-t border-gray-200 bg-white p-3">
            <p className="truncate text-sm font-medium text-gray-700">
              {attachment.filename}
            </p>
            <p className="text-xs text-gray-500">
              {formatFileSize(attachment.size)}
            </p>
          </div>
        </div>
      );
    }
    if (type === 'audio') {
      return renderAudioPlayer();
    }

    if (type === 'audio') {
      return (
        <div className="rounded-lg border border-gray-200 bg-white p-4 transition-all duration-300 hover:shadow-lg">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-12 w-12 rounded-full transition-all duration-300',
                'bg-blue-100 text-blue-600 hover:bg-blue-200'
              )}
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6" />
              )}
            </Button>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-gray-700">
                {attachment.filename}
              </p>
              <p className="text-xs text-gray-500">
                {formatFileSize(attachment.size)}
              </p>
            </div>
            <Volume2 className="h-5 w-5 text-gray-400" />
          </div>
        </div>
      );
    }

    // Default file preview
    return (
      <div
        className="group cursor-pointer rounded-lg border border-gray-200 bg-white p-4 transition-all duration-300 hover:shadow-lg"
        onClick={() => setIsOpen(true)}
      >
        <div className="flex items-center gap-4">
          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-105',
              fileDetails.color
            )}
          >
            {fileDetails.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-gray-700">
              {attachment.filename}
            </p>
            <p className="text-xs text-gray-500">
              {formatFileSize(attachment.size)}
            </p>
          </div>
          <Download className="h-5 w-5 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
      </div>
    );
  };

  const renderPreviewContent = () => {
    const type = attachment.type?.toLowerCase();
    const fileDetails = getFileTypeDetails(attachment.filename, type);

    if (type === 'image') {
      return (
        <div className="relative max-h-[70vh] w-full overflow-hidden rounded-lg">
          <Image
            src={fullUrl || '/placeholder.svg'}
            alt={attachment.filename}
            width={1200}
            height={800}
            priority
            className="h-auto w-full object-contain"
          />
        </div>
      );
    }

    if (type === 'video') {
      return <video src={fullUrl} controls className="w-full rounded-lg" />;
    }

    if (type === 'audio') {
      return (
        <div className="w-full rounded-lg bg-gray-50 p-6">
          <audio src={fullUrl} controls className="w-full" />
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center gap-6 rounded-lg bg-gray-50 py-12">
        <div
          className={cn(
            'flex h-24 w-24 items-center justify-center rounded-xl',
            fileDetails.color
          )}
        >
          {React.cloneElement(fileDetails.icon, { className: 'h-12 w-12' })}
        </div>
        <div className="text-center">
          <p className="text-xl font-medium text-gray-700">
            {attachment.filename}
          </p>
          <p className="mt-2 text-sm text-gray-500">
            {formatFileSize(attachment.size)}
          </p>
        </div>
      </div>
    );
  };

  return (
    <>
      {renderPreview()}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl bg-white p-0">
          <DialogHeader className="border-b border-gray-200 p-4">
            <DialogTitle className="flex items-center justify-between">
              <DialogDescription className='hidden'>
                This is a description of the dialog.
              </DialogDescription>
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg',
                    getFileTypeDetails(attachment.filename, attachment.type)
                      .color
                  )}
                >
                  {
                    getFileTypeDetails(attachment.filename, attachment.type)
                      .icon
                  }
                </div>
                <span className="truncate text-base font-medium text-gray-700">
                  {attachment.filename}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={downloadFile}
                  size="sm"
                  className="gap-2 bg-blue-500 text-white hover:bg-blue-600 mr-8"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="p-6">
            {attachment.type === 'audio'
              ? renderAudioPlayer()
              : renderPreviewContent()}
          </div>

          {/* <div className="p-6">{renderPreviewContent()}</div> */}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MessageAttachment;
