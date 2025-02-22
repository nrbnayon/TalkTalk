import dynamic from 'next/dynamic';

const LottiePlayer = dynamic(
  () => import('@lottiefiles/react-lottie-player').then(mod => mod.Player),
  { ssr: false }
);

import loadingAnimation from '@/assets/lottie/loadinglottie.json';
import messagingAnimation from '@/assets/lottie/Message.json';
import { MessageSquarePlus } from 'lucide-react';

export const LottieLoading = () => {
  return (
    <div className="flex items-center justify-center w-full">
      <LottiePlayer
        autoplay
        loop
        src={loadingAnimation}
        style={{ height: '200px', width: '200px' }}
      />
    </div>
  );
};

export const EmptyStateMessage = () => {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-md w-full animate-fade-in">
        <div className="relative backdrop-blur-sm bg-white/30 rounded-2xl p-8">
          <div className="w-64 h-64 mx-auto mb-6">
            <LottiePlayer
              autoplay
              loop
              src={messagingAnimation}
              className="w-full h-full"
            />
          </div>

          <div className="space-y-4 text-center">
            <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-slate-100/80 backdrop-blur-sm">
              <MessageSquarePlus className="w-4 h-4 mr-2 text-slate-600" />
              <span className="text-sm font-medium text-slate-600">
                New Conversation
              </span>
            </div>

            <h3 className="text-2xl font-semibold tracking-tight text-slate-900">
              Start Your First Chat
            </h3>

            <p className="text-slate-500 leading-relaxed">
              Begin a conversation and watch your messages appear here.
              We&lsquo;re ready when you are.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
