//components\chat\PinnedMessage.js
import { Pin, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PinnedMessage = ({ message, onUnpin, onScrollTo }) => {
  return (
    <div className="border-b bg-white shadow-sm sticky top-0 z-10">
      <div className="px-4 py-2 hover:bg-gray-50/80 transition-colors">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <div className="flex items-center gap-2">
            <Pin className="h-4 w-4 text-blue-500" />
            <span className="font-medium">Pinned Message</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onScrollTo}
              className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <ChevronDown className="h-4 w-4" />
              <span className="text-xs">Jump to message</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onUnpin}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div onClick={onScrollTo} className="cursor-pointer">
          {message.content}
        </div>
      </div>
    </div>
  );
};

export default PinnedMessage;
