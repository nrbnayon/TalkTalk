'use client';
import moment from 'moment';
import { UserRound, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useSelector } from 'react-redux';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { motion } from 'framer-motion'; // Import framer-motion for animations
import { useSocket } from '@/context/SocketContext';

const UserHome = () => {
  const formattedDate = moment().format('dddd, MMMM Do YYYY');
  const { user } = useSelector(state => state.auth);
  const { onlineUsers } = useSocket();

  // Check if the current user is online
  const isOnline = onlineUsers.some(onlineUser => onlineUser._id === user._id);

  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 px-4 py-8 w-full">
      <motion.div
        className="max-w-5xl mx-auto space-y-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.7, ease: 'easeOut' } }}
      >
        {/* Header Section */}
        <div>
          <p className="text-gray-600 ml-6 text-sm">Today {formattedDate}</p>
        </div>
        <motion.div
          className="flex items-center gap-6 mb-12"
          variants={cardVariants}
          initial="initial"
          animate="animate"
        >
          <div className="relative">
            <Avatar className="w-24 h-24 border-2 border-blue-500">
              <AvatarImage src={user?.image} alt="Profile" />
              <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            {/* Online/Offline Indicator */}
            <span
              className={`absolute bottom-2 right-2 w-3 h-3 rounded-full ${
                isOnline ? 'bg-green-500' : 'bg-red-500'
              }`}
              title={isOnline ? 'Online' : 'Offline'}
            ></span>
          </div>
          <div className="flex-1">
            <h1 className="text-lg text-gray-600 font-normal">Welcome!</h1>
            <h2 className="text-3xl font-semibold text-gray-800">
              {user?.name}
            </h2>
          </div>
          <Button
            variant="outline"
            className="hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200"
          >
            Share profile
          </Button>
        </motion.div>

        {/* Quick Actions Title */}
        <h3 className="text-2xl font-medium text-gray-800 mb-6">
          Explore Quick Actions
        </h3>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Easy Meetings Card */}
          <motion.div
            className="welcome-card bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300"
            variants={cardVariants}
            initial="initial"
            animate="animate"
          >
            <div className="h-48 flex items-center justify-center mb-6">
              <Image
                src="/images/meeting.png"
                alt="Easy meetings"
                width={140}
                height={140}
                className="object-contain"
              />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Effortless Meetings
            </h3>
            <p className="text-gray-600 mb-6">
              Invite anyone, even without Skype. No sign-ups or downloads
              needed.
            </p>
            <Button className="action-button action-button-primary w-full bg-blue-600 hover:bg-blue-700 text-white">
              <span>Meet Now</span>
              <ArrowDown className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>

          {/* Call Card */}
          <motion.div
            className="welcome-card bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300"
            variants={cardVariants}
            initial="initial"
            animate="animate"
          >
            <div className="h-48 flex items-center justify-center mb-6">
              <Image
                src="/images/call.png"
                alt="Call devices"
                width={140}
                height={140}
                className="object-contain"
              />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Connect with Confidence
            </h3>
            <p className="text-gray-600 mb-6">
              Free Skype to Skype calls, plus low rates for mobiles and
              landlines.
            </p>
            <Button className="action-button action-button-secondary w-full bg-green-500 hover:bg-green-600 text-white">
              Open dial pad
            </Button>
          </motion.div>
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-700">
            Welcome to Chat
          </h1>
          <p className="text-gray-500 mt-2">
            Start a conversation and connect instantly.
          </p>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <span className="text-gray-600">Not you? </span>
          <a href="#" className="text-blue-500 hover:underline font-medium">
            Check account
          </a>
        </div>
      </motion.div>
    </div>
  );
};

export default UserHome;
