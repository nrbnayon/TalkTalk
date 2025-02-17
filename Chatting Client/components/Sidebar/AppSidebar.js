// components\Sidebar\AppSidebar.js
"use client";
import React, { useEffect, useState } from "react";
import {
  Search,
  MoreVertical,
  Pin,
  Trash2,
  EyeOff,
  Edit,
  MessageCircle,
  Video,
  Star,
  Archive,
  Filter,
  ShieldBan,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Sidebar } from "../ui/sidebar";
import { useSocket } from "@/context/SocketContext";
import { Input } from "../ui/input";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import {
  fetchChats,
  selectChat,
  updateChatPin,
  deleteChat,
  updateChatHidden,
  blockUnblockChat,
} from "@/redux/features/chat/chatSlice";
import { formatDistanceToNow } from "date-fns";
import { Tooltip } from "@/components/ui/tooltip";
import { GenerateSlug } from "@/utils/GenerateSlug";
import UserMenu from "../Auth/UserMenu";
import { cn } from "@/lib/utils";

const AppSidebar = () => {
  const { onlineUsers } = useSocket();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { chats, selectedChat } = useSelector((state) => state.chat);
  const [filteredChats, setFilteredChats] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  const userName = GenerateSlug(user?.name);

  // console.log(
  //   "Get Login user in AppSidebar",
  //   user,
  //   "My All chats:",
  //   chats,
  //   "Select for chat:",
  //   selectedChat
  // );

  useEffect(() => {
    if (user) {
      dispatch(fetchChats());
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (!chats) return;

    let filtered = [...chats];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((chat) => {
        const otherUser = chat.users.find((u) => u._id !== user?._id);
        return (
          otherUser?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          chat.latestMessage?.content
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase())
        );
      });
    }

    // Apply type filter
    switch (filterType) {
      case "unread":
        filtered = filtered.filter(
          (chat) => !chat.latestMessage?.readBy?.includes(user?._id)
        );
        break;
      case "pinned":
        // filtered = filtered.filter((chat) => chat.isPinned);
        filtered = filtered.map((chat) => ({
          ...chat,
          isPinned: chat.pinnedBy?.includes(user?._id),
        }));
        break;
      case "archived":
        filtered = filtered.filter((chat) => chat.isArchived);
        break;
    }

    // Sort chats
    filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return (
        new Date(b.latestMessage?.createdAt || b.createdAt) -
        new Date(a.latestMessage?.createdAt || a.createdAt)
      );
    });

    setFilteredChats(filtered);
  }, [chats, searchQuery, filterType, user]);

  const tabs = [
    {
      id: "all",
      label: "All",
      icon: <MessageCircle className='h-5 w-5' />,
      count: chats?.length || 0,
    },
    {
      id: "unread",
      label: "Unread",
      icon: <Star className='h-5 w-5' />,
      count:
        chats?.filter(
          (chat) => !chat.latestMessage?.readBy?.includes(user?._id)
        )?.length || 0,
    },
    {
      id: "pinned",
      label: "Pinned",
      icon: <Pin className='h-5 w-5' />,
      count: chats?.filter((chat) => chat.isPinned)?.length || 0,
    },
    {
      id: "archived",
      label: "Archived",
      icon: <Archive className='h-5 w-5' />,
      count: chats?.filter((chat) => chat.isArchived)?.length || 0,
    },
  ];

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setFilterType(tabId);
  };

  const handleChatClick = (chat) => {
    dispatch(selectChat(chat));
  };

  const handlePinChat = (e, chatId) => {
    e.preventDefault();
    e.stopPropagation();

    const chatToToggle = chats.find((chat) => chat._id === chatId);
    const isPinned = chatToToggle.pinnedBy?.includes(user?._id);

    // If we're unpinning, always allow it
    if (isPinned) {
      dispatch(updateChatPin({ chatId, action: "pin" }));
      return;
    }

    // Check if we already have 4 pinned chats
    const userPinnedChats = chats.filter((chat) =>
      chat.pinnedBy?.includes(user?._id)
    );

    // Only allow pinning if we have less than 4 pins
    if (userPinnedChats.length < 4) {
      dispatch(updateChatPin({ chatId, action: "pin" }));
    } else {
      alert("You can only pin up to 4 chats");
    }
  };

  const handleBlockChat = (e, chatId) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(blockUnblockChat(chatId));
  };

  const renderChatItem = (chat) => {
    const otherUser = chat.users.find((u) => u._id !== user?._id);
    const lastMessage = chat.latestMessage;
    const isOnline = otherUser?.onlineStatus;
    const unreadCount =
      lastMessage && !lastMessage.readBy?.includes(user?._id) ? 1 : 0;

    return (
      <div
        key={chat._id}
        className={`group relative flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
          selectedChat?._id === chat._id
            ? "bg-blue-50 hover:bg-blue-100"
            : "hover:bg-gray-50"
        } ${chat.isPinned ? "bg-blue-50" : ""}`}
      >
        <Link
          href={`/chat/${chat._id}`}
          className='flex-1 flex items-center gap-3'
          onClick={() => handleChatClick(chat)}
        >
          <div className='relative'>
            <Avatar className='h-12 w-12 border-2 border-gray-300'>
              <AvatarImage src={otherUser?.image} alt={otherUser?.name} />
              <AvatarFallback>{otherUser?.name.substring(0, 2)}</AvatarFallback>
            </Avatar>
            <span
              className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white ${
                isOnline ? "bg-green-500" : "bg-gray-400"
              }`}
            />
            {/* Show pin icon at top right */}
            {chat.isPinned && (
              <Pin
                className='absolute -top-1 -right-1 h-4 w-4 text-blue-500'
                fill='currentColor'
              />
            )}
            {/* Show block icon at top left */}
            {chat.isBlocked && (
              <ShieldBan
                className='absolute -top-1 -left-1 h-4 w-4 text-red-500'
                fill='currentColor'
              />
            )}
          </div>

          <div className='flex-1 min-w-0'>
            <div className='flex justify-between items-center'>
              <h3 className='font-semibold text-gray-900 truncate'>
                {otherUser?.name}
              </h3>
              <span className='text-xs text-gray-500'>
                {lastMessage &&
                  formatDistanceToNow(new Date(lastMessage.createdAt), {
                    addSuffix: true,
                  })}
              </span>
            </div>
            <div className='flex items-center justify-between mt-1'>
              {lastMessage?.isDeleted ? (
                <span className='text-sm text-gray-400 italic'>
                  Message deleted
                </span>
              ) : (
                <p className='text-sm text-gray-600 truncate'>
                  {lastMessage?.content.substring(0, 20)}...
                </p>
              )}
              {unreadCount > 0 && (
                <Badge className='bg-blue-500 text-white'>{unreadCount}</Badge>
              )}
            </div>
          </div>
        </Link>

        <div className='opacity-0 group-hover:opacity-100 transition-opacity'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className='p-1 hover:bg-gray-200 rounded-full'>
                <MoreVertical className='h-4 w-4 text-gray-500' />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              // align='end'
              // className='w-48'
              className={cn("bg-white z-10")}
            >
              <DropdownMenuItem
                onClick={(e) => handlePinChat(e, chat._id)}
                className='flex items-center gap-2'
              >
                <Pin className='h-4 w-4' />
                {chat.isPinned ? "Unpin chat" : "Pin chat"}
              </DropdownMenuItem>
              {/* <DropdownMenuItem className='flex items-center gap-2'>
                <Video className='h-4 w-4' />
                Start video call
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => dispatch(updateChatHidden({ chatId: chat._id }))}
                className='flex items-center gap-2'
              >
                <EyeOff className='h-4 w-4' />
                Hide chat
              </DropdownMenuItem> */}
              {/* <DropdownMenuSeparator /> */}
              <DropdownMenuItem
                onClick={(e) => handleBlockChat(e, chat._id)}
                className='flex items-center gap-2 text-red-500'
              >
                <ShieldBan className='h-4 w-4' />
                {chat.isBlocked ? "Unblock chat" : "Block chat"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => dispatch(deleteChat(chat._id))}
                className='flex items-center gap-2 text-red-500'
              >
                <Trash2 className='h-4 w-4' />
                Delete chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  };

  return (
    <Sidebar className='w-80 flex flex-col bg-white border-r border-gray-200'>
      {/* Header */}
      <div className='p-4 border-b border-gray-200'>
        <div className='flex items-center justify-between mb-4'>
          <h1 className='text-xl font-bold text-gray-900'>Messages</h1>
          <div className='flex items-center gap-2'>
            <Tooltip content='New message'>
              <button className='p-2 text-gray-600 hover:bg-gray-100 rounded-full'>
                <Edit className='h-5 w-5' />
              </button>
            </Tooltip>{" "}
            <Tooltip content='Filter'>
              <button className='p-2 text-gray-600 hover:bg-gray-100 rounded-full'>
                <Filter className='h-5 w-5' />
              </button>
            </Tooltip>
            <button className='p-1 hover:bg-gray-100 rounded'>
              <UserMenu />{" "}
            </button>
          </div>
        </div>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
          <Input
            type='text'
            placeholder='Search messages...'
            className='w-full pl-10 bg-gray-50'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className='flex gap-2 p-2 overflow-x-auto border-b border-gray-200'>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-blue-100 text-blue-600"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <Badge variant='secondary' className='bg-gray-200 text-gray-700'>
                {tab.count}
              </Badge>
            )}
          </button>
        ))}
      </div>

      {/* Chat List */}
      <div className='flex-1 overflow-y-auto'>
        {filteredChats.length === 0 ? (
          <div className='flex flex-col items-center justify-center h-full text-center p-4'>
            <MessageCircle className='h-12 w-12 text-gray-400 mb-2' />
            <h3 className='text-lg font-semibold text-gray-900'>No messages</h3>
            <p className='text-sm text-gray-500'>
              Start a conversation or search for messages
            </p>
          </div>
        ) : (
          <div className='divide-y divide-gray-100'>
            {filteredChats.map(renderChatItem)}
          </div>
        )}
      </div>
    </Sidebar>
  );
};

export default AppSidebar;

// // components\Sidebar\AppSidebar.js
// "use client";

// import React, { useEffect, useState } from "react";
// import {
//   Search,
//   Phone,
//   Users,
//   Bell,
//   MoreVertical,
//   Pin,
//   Trash2,
//   EyeOff,
//   Edit,
// } from "lucide-react";
// import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
// import { Badge } from "@/components/ui/badge";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { cn } from "@/lib/utils";
// import Image from "next/image";
// import LoginUser from "@/assets/icons/user-one.png";
// import UserMenu from "../Auth/UserMenu";
// import { Sidebar } from "../ui/sidebar";
// import { useSocket } from "@/context/SocketContext";
// import { Input } from "../ui/input";
// import { useDispatch, useSelector } from "react-redux";

// import Link from "next/link";
// import {
//   fetchChats,
//   selectedChat,
//   updateChatPin,
//   deleteChat,
//   updateChatHidden,
// } from "@/redux/features/chat/chatSlice";
// import { GenerateSlug } from "@/utils/GenerateSlug";

// const AppSidebar = () => {
//   const { onlineUsers } = useSocket();
//   const dispatch = useDispatch();
//   const { user } = useSelector((state) => state.auth || {});
//   const { chats, selectedChat } = useSelector((state) => state.chat);
//   const userName = GenerateSlug(user?.name);

//   useEffect(() => {
//     if (user) {
//       dispatch(fetchChats());
//     }
//   }, [dispatch, user]);

//   console.log(
//     "Get Login user in AppSidebar",
//     user,
//     "My All chats:",
//     chats,
//     "Select for chat:",
//     selectedChat
//   );

//   const initialChats = [
//     {
//       id: 1,
//       name: "Copilot",
//       message: "Hey, this is Copilot!",
//       time: "12/5/2024",
//       avatar: "/lovable-uploads/c6d2b5b1-1f26-4323-afb5-e9353e5e383c.png",
//       status: "online",
//       pinned: false,
//     },
//     {
//       id: 2,
//       name: "IT Support || STA",
//       message: "Alif Shariyar joined this...",
//       time: "11:12 AM",
//       avatar: "/placeholder.svg",
//       unread: 34,
//       pinned: false,
//     },
//     {
//       id: 3,
//       name: "Alpha Bytes (Internal)",
//       message: "Call ended | 17m 19s",
//       time: "9:41 AM",
//       avatar: "/placeholder.svg",
//       pinned: false,
//     },
//     {
//       id: 4,
//       name: "Official Announcement - 2",
//       message: "Shammi added...",
//       time: "Sat",
//       avatar: "/placeholder.svg",
//       pinned: false,
//     },
//     {
//       id: 5,
//       name: "Limon Islam 🏠",
//       message: "Vaiya HR dekha korte bolce",
//       time: "Sat",
//       avatar: "/placeholder.svg",
//       status: "away",
//       pinned: false,
//     },
//   ];

//   // const [chats, setChats] = useState(initialChats);
//   const [activeTab, setActiveTab] = useState("chats");
//   const [searchQuery, setSearchQuery] = useState("");

//   const togglePin = (chatId) => {
//     const pinnedChats = chats.filter((chat) => chat.pinned);
//     const chatToToggle = chats.find((chat) => chat.id === chatId);

//     if (pinnedChats.length < 4) {
//       const updatedChats = chats.map((chat) =>
//         chat.id === chatId ? { ...chat, pinned: !chat.pinned } : chat
//       );

//       // Sort so pinned chats come first
//       const sortedChats = updatedChats.sort(
//         (a, b) =>
//           b.pinned - a.pinned ||
//           updatedChats.indexOf(a) - updatedChats.indexOf(b)
//       );

//       setChats(sortedChats);
//     } else if (chatToToggle.pinned) {
//       // Allow unpinning if already pinned
//       const updatedChats = chats.map((chat) =>
//         chat.id === chatId ? { ...chat, pinned: false } : chat
//       );
//       setChats(updatedChats);
//     }
//   };

//   const deleteChat = (chatId) => {
//     setChats(chats.filter((chat) => chat.id !== chatId));
//   };

//   const hideChat = (chatId) => {
//     setChats(chats.filter((chat) => chat.id !== chatId));
//   };

//   // const handleChatClick = (chatId) => {
//   //   router.push(`/welcome-nayon/chat/${chatId}`);
//   // };

//   const tabs = [
//     {
//       id: "chats",
//       label: "Chats",
//       icon: <div className='text-lg'>💬</div>,
//       badge: 1,
//     },
//     {
//       id: "calls",
//       label: "Calls",
//       icon: <Phone className='h-5 w-5' />,
//     },
//     {
//       id: "contacts",
//       label: "Contacts",
//       icon: <Users className='h-5 w-5' />,
//     },
//     {
//       id: "notifications",
//       label: "Notifications",
//       icon: <Bell className='h-5 w-5' />,
//       badge: 7,
//     },
//   ];

//   return (
//     <Sidebar className={cn("min-w-80 overflow-hidden")}>
//       <div className='w-80 h-screen flex flex-col border-r border-gray-200 bg-white'>
//         {/* User Profile Header */}
//         <div className='p-3 flex items-center justify-between border-b border-gray-200'>
//           <div className='flex items-center gap-2'>
//             <div className='relative'>
//               <Avatar className='h-10 w-10 border border-gray-300 p-1'>
//                 <Image
//                   src={user?.profileImage || user?.image || LoginUser}
//                   alt='User'
//                   width={100}
//                   height={100}
//                   priority
//                   className='rounded-full'
//                 />
//               </Avatar>
//               <div className='absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white'></div>
//             </div>
//             <div className='flex flex-col'>
//               <span className='text-sm font-semibold'>
//                 {user?.name || user?.email || "User"}
//               </span>
//               <span className='text-xs text-gray-500'>Be right back</span>
//             </div>
//           </div>
//           <button className='p-1 hover:bg-gray-100 rounded'>
//             {/* <MoreVertical className='h-5 w-5 text-gray-500' /> */}
//             <UserMenu />
//           </button>
//         </div>
//         {/* Search Bar */}
//         <div className='p-3'>
//           <div className='relative'>
//             <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
//             <Input
//               type='text'
//               placeholder='People, groups, messages'
//               className='w-full pl-10 pr-4 py-2 bg-gray-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//             />
//           </div>
//         </div>
//         {/* Navigation Tabs */}
//         <div className='flex justify-between px-3 py-2 border-b border-gray-200'>
//           {tabs.map((tab) => (
//             <button
//               key={tab.id}
//               onClick={() => setActiveTab(tab.id)}
//               className={`flex flex-col items-center p-2 rounded-md relative ${
//                 activeTab === tab.id
//                   ? "text-blue-600"
//                   : "text-gray-500 hover:text-gray-700"
//               }`}
//             >
//               {tab.icon}
//               <span className='text-xs mt-1'>{tab.label}</span>
//               {tab.badge && (
//                 <Badge className='absolute -top-1 -right-1 h-4 min-w-4 flex text-white items-center justify-center bg-red-500 text-[10px]'>
//                   {tab.badge}
//                 </Badge>
//               )}
//             </button>
//           ))}
//         </div>

//         <div className='flex-1 overflow-y-auto'>
//           <div className='p-3'>
//             <div className='flex items-center justify-between'>
//               <h2 className='text-sm font-semibold text-gray-500 mb-2'>
//                 Online ({onlineUsers.length})
//               </h2>
//               <button className='p-2 bg-blue-500 rounded-full '>
//                 <Edit className='h-4 w-4 text-white' />
//               </button>
//             </div>
//             <div className='space-y-1 mt-2'>
//               {chats.map((chat) => (
//                 <div
//                   key={chat.id}
//                   className={cn(
//                     "w-full flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 transition-colors",
//                     chat.pinned && "bg-blue-50"
//                   )}
//                   onClick={() => handleChatClick(chat.id)}
//                 >
//                   <div className='relative flex-shrink-0'>
//                     <Link href={`/welcome-${userName}/chat/${chat.id}`}>
//                       <Avatar className='h-10 w-10 border border-gray-300'>
//                         <AvatarImage src={chat.avatar} alt={chat.name} />
//                         <AvatarFallback>
//                           {chat.name.substring(0, 2)}
//                         </AvatarFallback>
//                       </Avatar>
//                     </Link>
//                     {chat.status && (
//                       <div
//                         className={cn(
//                           "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white",
//                           chat.status === "online"
//                             ? "bg-green-500"
//                             : "bg-yellow-500"
//                         )}
//                       ></div>
//                     )}
//                     {chat.pinned && (
//                       <Pin
//                         className='absolute top-0 right-0 h-3 w-3 text-blue-500'
//                         fill='currentColor'
//                       />
//                     )}
//                   </div>
//                   <div className='flex-1 min-w-0'>
//                     <div className='flex justify-between items-start'>
//                       <span className='text-sm font-semibold truncate'>
//                         {chat.name}
//                       </span>
//                       <span className='text-xs text-gray-500 flex-shrink-0'>
//                         {chat.time}
//                       </span>
//                     </div>
//                     <p className='text-sm text-gray-500 truncate'>
//                       {chat.message}
//                     </p>
//                   </div>
//                   {chat.unread && (
//                     <Badge className='h-5 min-w-5 flex items-center text-white justify-center bg-blue-500'>
//                       {chat.unread}
//                     </Badge>
//                   )}
//                   <DropdownMenu>
//                     <DropdownMenuTrigger>
//                       <MoreVertical className='h-4 w-4 text-gray-500' />
//                     </DropdownMenuTrigger>
//                     <DropdownMenuContent className={cn("bg-white z-10")}>
//                       <DropdownMenuItem
//                         onSelect={() => togglePin(chat.id)}
//                         className='flex items-center gap-2'
//                       >
//                         <Pin className='h-4 w-4' />
//                         {chat.pinned ? "Unpin" : "Pin"}
//                       </DropdownMenuItem>
//                       <DropdownMenuItem
//                         onSelect={() => deleteChat(chat.id)}
//                         className='flex items-center gap-2 text-red-500'
//                       >
//                         <Trash2 className='h-4 w-4' />
//                         Delete
//                       </DropdownMenuItem>
//                       <DropdownMenuItem
//                         onSelect={() => hideChat(chat.id)}
//                         className='flex items-center gap-2'
//                       >
//                         <EyeOff className='h-4 w-4' />
//                         Hide
//                       </DropdownMenuItem>
//                     </DropdownMenuContent>
//                   </DropdownMenu>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>
//     </Sidebar>
//   );
// };

// export default AppSidebar;
