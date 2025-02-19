'use client';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
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
  FilePdf,
  FileCode,
  FileJson,
  FileSpreadsheet,
  FileArchive,
  Mail,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const MessageAttachment = ({ attachment }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const getFullUrl = url => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    if (url.startsWith('blob:')) return url;
    return `http://localhost:4000${url}`;
  };

  const fullUrl = getFullUrl(attachment.url);

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
      // You could add toast notification here
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
        icon: <FilePdf className="h-6 w-6" />,
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

  const renderPreview = () => {
    const type = attachment.type?.toLowerCase();
    const fileDetails = getFileTypeDetails(attachment.filename, type);

    if (type === 'image') {
      return (
        <div className="group relative cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-white transition-all duration-300 hover:shadow-lg">
          <div
            onClick={() => setIsOpen(true)}
            className="relative h-[240px] w-full"
          >
            <Image
              src={fullUrl || '/placeholder.svg'}
              alt={attachment.filename}
              fill
              priority
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
              <div className="flex flex-col items-center gap-2">
                <Download className="h-8 w-8 text-white" />
                <span className="text-sm font-medium text-white">Preview</span>
              </div>
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
                  className="gap-2 bg-blue-500 text-white hover:bg-blue-600"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="rounded-full hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="p-6">{renderPreviewContent()}</div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MessageAttachment;
// 'use client';
// import { useState } from 'react';
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from '@/components/ui/dialog';
// import { Button } from '@/components/ui/button';
// import {
//   Download,
//   Play,
//   Pause,
//   Volume2,
//   File,
//   ImageIcon,
//   Video,
//   Music,
// } from 'lucide-react';
// import { cn } from '@/lib/utils';
// import Image from 'next/image';

// const MessageAttachment = ({ attachment }) => {
//   const [isOpen, setIsOpen] = useState(false);
//   const [isPlaying, setIsPlaying] = useState(false);

//   const getFullUrl = url => {
//     if (!url) return '';
//     if (url.startsWith('http')) return url;
//     if (url.startsWith('blob:')) return url;
//     return `http://localhost:4000${url}`;
//   };

//   const fullUrl = getFullUrl(attachment.url);

//   const downloadFile = () => {
//     // Create a temporary anchor element to trigger the download
//     const anchor = document.createElement('a');
//     anchor.href = fullUrl;
//     anchor.download = attachment.filename;
//     anchor.click();
//   };

//   const formatFileSize = bytes => {
//     if (bytes === 0) return '0 Bytes';
//     const k = 1024;
//     const sizes = ['Bytes', 'KB', 'MB', 'GB'];
//     const i = Math.floor(Math.log(bytes) / Math.log(k));
//     return (
//       Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
//     );
//   };

//   const getFileIcon = type => {
//     switch (type?.toLowerCase()) {
//       case 'image':
//         return <ImageIcon className="h-6 w-6" />;
//       case 'video':
//         return <Video className="h-6 w-6" />;
//       case 'audio':
//         return <Music className="h-6 w-6" />;
//       default:
//         return <File className="h-6 w-6" />;
//     }
//   };

//   const renderPreview = () => {
//     const type = attachment.type?.toLowerCase();

//     if (type === 'image') {
//       return (
//         <div
//           className="group relative cursor-pointer overflow-hidden rounded-lg"
//           onClick={() => setIsOpen(true)}
//         >
//           <Image
//             src={fullUrl || '/placeholder.svg'}
//             alt={attachment.filename}
//             width={240}
//             height={240}
//             priority
//             className="w-full h-[240px] object-cover transition-transform group-hover:scale-105"
//           />
//           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
//             <Download className="w-8 h-8 text-white" />
//           </div>
//         </div>
//       );
//     }

//     if (type === 'video') {
//       return (
//         <div
//           className="relative w-[240px] h-[180px] bg-gray-900 rounded-lg cursor-pointer overflow-hidden"
//           onClick={() => setIsOpen(true)}
//         >
//           <video
//             className="w-full h-full object-cover"
//             src={fullUrl}
//             onClick={e => e.stopPropagation()}
//           />
//           <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
//             <Play className="w-12 h-12 text-white" />
//           </div>
//         </div>
//       );
//     }

//     if (type === 'audio') {
//       return (
//         <div className="bg-gray-100 p-4 rounded-lg flex items-center gap-4 max-w-[280px] text-black">
//           <Button
//             variant="ghost"
//             size="icon"
//             className="h-10 w-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
//             onClick={() => setIsPlaying(!isPlaying)}
//           >
//             {isPlaying ? (
//               <Pause className="h-5 w-5" />
//             ) : (
//               <Play className="h-5 w-5" />
//             )}
//           </Button>
//           <div className="flex-1">
//             <div className="text-sm font-medium truncate text-black">
//               {attachment.filename}
//             </div>
//             <div className="text-xs text-gray-500 mt-1">
//               {formatFileSize(attachment.size)}
//             </div>
//           </div>
//           <Volume2 className="h-5 w-5 text-gray-500" />
//         </div>
//       );
//     }

//     // Default file preview
//     return (
//       <div
//         className="bg-gray-100 p-4 rounded-lg flex items-center gap-2 max-w-[280px] cursor-pointer hover:bg-gray-200 transition-colors text-black"
//         onClick={() => setIsOpen(true)}
//       >
//         <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-black">
//           {getFileIcon(type)}
//         </div>
//         <div className="flex-1">
//           <div className="text-sm font-medium truncate">
//             {attachment.filename}
//           </div>
//           <div className="text-xs text-gray-500 mt-1">
//             {formatFileSize(attachment.size)}
//           </div>
//         </div>
//       </div>
//     );
//   };

//   return (
//     <>
//       {renderPreview()}

//       <Dialog open={isOpen} onOpenChange={setIsOpen}>
//         <DialogContent className={cn('max-w-4xl z-50 bg-white')}>
//           <DialogHeader>
//             <DialogTitle className="flex items-center justify-between mt-5">
//               <div className="flex items-center gap-3">
//                 {getFileIcon(attachment.type)}
//                 <span className="truncate">{attachment.filename}</span>
//               </div>
//               <Button
//                 onClick={downloadFile}
//                 variant="outline"
//                 size="sm"
//                 className="mr-10 hover:border-2 border-green-400"
//               >
//                 <Download className="h-4 w-4" />
//                 Download
//               </Button>
//             </DialogTitle>
//           </DialogHeader>

//           <div
//             className={cn(
//               'mt-6',
//               attachment.type === 'image' && 'flex items-center justify-center'
//             )}
//           >
//             {attachment.type?.toLowerCase() === 'image' && (
//               <Image
//                 src={fullUrl || '/placeholder.svg'}
//                 alt={attachment.filename}
//                 width={800}
//                 height={600}
//                 priority
//                 className="max-h-[70vh] w-auto object-contain rounded-lg shadow-lg"
//               />
//             )}
//             {attachment.type?.toLowerCase() === 'video' && (
//               <video
//                 src={fullUrl}
//                 controls
//                 className="w-full rounded-lg shadow-lg"
//               />
//             )}
//             {attachment.type?.toLowerCase() === 'audio' && (
//               <div className="w-full bg-gray-100 p-6 rounded-lg shadow-inner">
//                 <audio src={fullUrl} controls className="w-full" />
//               </div>
//             )}
//             {!['image', 'video', 'audio'].includes(
//               attachment.type?.toLowerCase()
//             ) && (
//               <div className="flex flex-col items-center justify-center gap-6 py-12 bg-gray-100 rounded-lg text-black">
//                 <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-black">
//                   {getFileIcon(attachment.type)}
//                 </div>
//                 <div className="text-center">
//                   <p className="text-xl font-medium text-black">
//                     {attachment.filename}
//                   </p>
//                   <p className="text-sm text-gray-500 mt-2">
//                     {formatFileSize(attachment.size)}
//                   </p>
//                 </div>
//               </div>
//             )}
//           </div>
//         </DialogContent>
//       </Dialog>
//     </>
//   );
// };

// export default MessageAttachment;
