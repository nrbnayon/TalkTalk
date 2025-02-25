//components\chat\PinnedMessage.js
import React from 'react';
import { Pin, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

const PinnedMessage = ({ message, onUnpin, onScrollTo }) => {
  const pinnedTime = message.pinnedAt
    ? formatDistanceToNow(new Date(message.pinnedAt), { addSuffix: true })
    : '';
  const pinnedBy = message.pinnedBy?.name || 'Someone';

  return (
    <div className="bg-blue-50/80 border-b border-blue-100 p-3 flex items-center justify-between gap-4 animate-slideDown">
      <div
        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
        onClick={onScrollTo}
      >
        <Pin className="h-4 w-4 text-blue-500 flex-shrink-0" />
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Avatar className="h-6 w-6 border border-blue-100">
            <AvatarImage src={message.sender.image} alt={message.sender.name} />
            <AvatarFallback>
              {message.sender.name.substring(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-blue-900 truncate">{message.content}</p>
            <p className="text-xs text-blue-600">
              Pinned by {pinnedBy} {pinnedTime}
            </p>
          </div>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 hover:bg-blue-100/50"
        onClick={onUnpin}
      >
        <X className="h-4 w-4 text-blue-500" />
      </Button>
    </div>
  );
};

export default PinnedMessage;

// import { Pin, ChevronDown, X } from 'lucide-react';
// import { Button } from '@/components/ui/button';

// const PinnedMessage = ({ message, onUnpin, onScrollTo }) => {
//   return (
//     <div className="border-b bg-white shadow-sm sticky top-0 z-10">
//       <div className="px-4 py-2 hover:bg-gray-50/80 transition-colors">
//         <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
//           <div className="flex items-center gap-2">
//             <Pin className="h-4 w-4 text-blue-500" />
//             <span className="font-medium">Pinned Message</span>
//           </div>
//           <div className="flex items-center gap-2">
//             <Button
//               variant="ghost"
//               size="sm"
//               onClick={onScrollTo}
//               className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
//             >
//               <ChevronDown className="h-4 w-4" />
//               <span className="text-xs">Jump to message</span>
//             </Button>
//             <Button
//               variant="ghost"
//               size="sm"
//               onClick={onUnpin}
//               className="text-gray-500 hover:text-gray-700"
//             >
//               <X className="h-4 w-4" />
//             </Button>
//           </div>
//         </div>
//         <div onClick={onScrollTo} className="cursor-pointer">
//           {message.content}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default PinnedMessage;

// src/components/chat/PinnedMessage.jsx
// import React from 'react';
// import { Pin } from 'lucide-react';

// const PinnedMessage = ({ message, onUnpin, onScrollTo }) => {
//   if (!message) return null;
//   return (
//     <div className="bg-gray-50 p-3 rounded-lg mb-2 flex items-center justify-between border border-gray-200">
//       <div>
//         <div className="flex items-center gap-2">
//           <Pin className="w-4 h-4 text-gray-500" />
//           <span className="font-bold text-sm">
//             Pinned by {message.pinnedBy?.name || 'Unknown'}
//           </span>
//         </div>
//         <p className="text-sm mt-1">{message.content}</p>
//       </div>
//       <div className="flex items-center gap-2">
//         <button
//           onClick={() => onScrollTo(message._id)}
//           className="text-blue-500 text-sm"
//         >
//           View
//         </button>
//         <button
//           onClick={() => onUnpin(message._id)}
//           className="text-red-500 text-sm"
//         >
//           Unpin
//         </button>
//       </div>
//     </div>
//   );
// };

// export default PinnedMessage;