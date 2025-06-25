# Real-Time Chat App

> **Connect instantly with friends and communities through our feature-rich real-time messaging platform**

A modern, scalable real-time chat application built with the MERN stack, featuring instant messaging, file sharing, group chats, and advanced communication features for seamless user interactions.

## ✨ Features

### Core Messaging
- **Real-time Messaging** - Instant message delivery using Socket.IO
- **Group Chats** - Create and manage group conversations
- **Private Messages** - Secure one-on-one conversations
- **Message History** - Persistent chat history with pagination
- **Typing Indicators** - See when others are typing
- **Online Status** - Real-time user presence indicators

### Advanced Features
- **File Sharing** - Share images, documents, and media files
- **Message Reactions** - React to messages with emojis
- **Message Search** - Find messages across all conversations
- **Push Notifications** - Stay updated with desktop and mobile notifications
- **Message Encryption** - End-to-end encryption for secure communications
- **Dark/Light Theme** - Customizable UI themes

### User Management
- **User Authentication** - Secure login/register with JWT
- **Profile Management** - Customizable user profiles with avatars
- **Friend System** - Add, remove, and manage contacts
- **User Search** - Find and connect with other users
- **Blocking System** - Block unwanted users

## 🚀 Tech Stack

### Frontend
- **[React 18](https://react.dev/)** - Modern React with hooks and concurrent features
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript development
- **[Vite](https://vitejs.dev/)** - Lightning-fast build tool and dev server
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Socket.IO Client](https://socket.io/)** - Real-time bidirectional communication
- **[React Router](https://reactrouter.com/)** - Client-side routing
- **[Zustand](https://zustand-demo.pmnd.rs/)** - Lightweight state management
- **[React Hook Form](https://react-hook-form.com/)** - Performant forms with validation
- **[Framer Motion](https://www.framer.com/motion/)** - Smooth animations and transitions

### Backend
- **[Node.js](https://nodejs.org/)** - JavaScript runtime environment
- **[Express.js](https://expressjs.com/)** - Fast, unopinionated web framework
- **[MongoDB](https://www.mongodb.com/)** - NoSQL database for scalable data storage
- **[Mongoose](https://mongoosejs.com/)** - MongoDB object modeling for Node.js
- **[Socket.IO](https://socket.io/)** - Real-time engine for WebSocket connections
- **[JWT](https://jwt.io/)** - JSON Web Tokens for authentication
- **[Bcrypt](https://www.npmjs.com/package/bcrypt)** - Password hashing
- **[Multer](https://www.npmjs.com/package/multer)** - File upload handling
- **[Cloudinary](https://cloudinary.com/)** - Cloud-based image and video management

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn package manager

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/nrbnayon/talktalk.git
   cd talktalk
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Configure your `.env` file:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # Database
   MONGODB_URI=mongodb://localhost:27017/chatapp
   # or MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/chatapp
   
   # JWT Secret
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=7d
   
   # Cloudinary (for file uploads)
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   
   # CORS Origin (Frontend URL)
   CORS_ORIGIN=http://localhost:3000
   ```

4. **Start the backend server**
   ```bash
   npm run dev
   # Server will run on http://localhost:5000
   ```

### Frontend Setup

1. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Configure your `.env` file:
   ```env
   VITE_API_URL=http://localhost:5000
   VITE_SOCKET_URL=http://localhost:5000
   VITE_APP_NAME=ChatApp
   ```

3. **Start the frontend development server**
   ```bash
   npm run dev
   # Frontend will run on http://localhost:3000
   ```

## 📁 Project Structure

```
realtime-chat-app/
├── backend/                    # Node.js/Express backend
│   ├── controllers/           # Route controllers
│   │   ├── authController.js
│   │   ├── chatController.js
│   │   ├── messageController.js
│   │   └── userController.js
│   ├── middleware/            # Custom middleware
│   │   ├── auth.js
│   │   ├── upload.js
│   │   └── validation.js
│   ├── models/               # MongoDB models
│   │   ├── User.js
│   │   ├── Chat.js
│   │   └── Message.js
│   ├── routes/               # API routes
│   │   ├── auth.js
│   │   ├── chats.js
│   │   ├── messages.js
│   │   └── users.js
│   ├── socket/               # Socket.IO configuration
│   │   └── socketHandler.js
│   ├── utils/                # Utility functions
│   │   ├── cloudinary.js
│   │   ├── generateToken.js
│   │   └── encryption.js
│   ├── config/               # Configuration files
│   │   └── database.js
│   └── server.js             # Entry point
│
├── frontend/                  # React frontend
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── Chat/
│   │   │   │   ├── ChatList.tsx
│   │   │   │   ├── ChatWindow.tsx
│   │   │   │   ├── MessageInput.tsx
│   │   │   │   └── MessageBubble.tsx
│   │   │   ├── Auth/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   └── RegisterForm.tsx
│   │   │   ├── Layout/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Header.tsx
│   │   │   │   └── Layout.tsx
│   │   │   └── UI/           # Common UI components
│   │   │       ├── Button.tsx
│   │   │       ├── Modal.tsx
│   │   │       └── Avatar.tsx
│   │   ├── pages/            # Page components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   └── Profile.tsx
│   │   ├── hooks/            # Custom React hooks
│   │   │   ├── useSocket.ts
│   │   │   ├── useAuth.ts
│   │   │   └── useChat.ts
│   │   ├── store/            # State management
│   │   │   ├── authStore.ts
│   │   │   ├── chatStore.ts
│   │   │   └── uiStore.ts
│   │   ├── services/         # API services
│   │   │   ├── api.ts
│   │   │   ├── authService.ts
│   │   │   └── chatService.ts
│   │   ├── types/            # TypeScript definitions
│   │   │   ├── auth.ts
│   │   │   ├── chat.ts
│   │   │   └── user.ts
│   │   ├── utils/            # Utility functions
│   │   │   ├── formatTime.ts
│   │   │   ├── encryption.ts
│   │   │   └── constants.ts
│   │   └── styles/           # Global styles
│   │       └── globals.css
│   ├── public/               # Static assets
│   └── package.json
│
├── README.md
├── docker-compose.yml        # Docker configuration
└── .gitignore
```

## 🔧 API Endpoints

### Authentication
```
POST   /api/auth/register     # User registration
POST   /api/auth/login        # User login
POST   /api/auth/logout       # User logout
GET    /api/auth/me           # Get current user
PUT    /api/auth/profile      # Update profile
```

### Users
```
GET    /api/users             # Get all users
GET    /api/users/search      # Search users
POST   /api/users/friend      # Send friend request
PUT    /api/users/friend      # Accept/decline friend request
DELETE /api/users/friend/:id  # Remove friend
```

### Chats
```
GET    /api/chats             # Get user's chats
POST   /api/chats             # Create new chat
GET    /api/chats/:id         # Get chat details
PUT    /api/chats/:id         # Update chat
DELETE /api/chats/:id         # Delete chat
```

### Messages
```
GET    /api/messages/:chatId  # Get chat messages
POST   /api/messages          # Send message
PUT    /api/messages/:id      # Edit message
DELETE /api/messages/:id      # Delete message
POST   /api/messages/upload   # Upload file
```

## 🔌 Socket.IO Events

### Client to Server
```javascript
// Connection
'join-room'              // Join a chat room
'leave-room'             // Leave a chat room

// Messaging
'send-message'           // Send a new message
'edit-message'           // Edit existing message
'delete-message'         // Delete a message
'typing-start'           // Start typing indicator
'typing-stop'            // Stop typing indicator

// Status
'user-online'            // User comes online
'user-offline'           // User goes offline
```

### Server to Client
```javascript
// Messaging
'new-message'            // Receive new message
'message-edited'         // Message was edited
'message-deleted'        // Message was deleted

// Typing
'user-typing'            // Someone is typing
'user-stopped-typing'    // Someone stopped typing

// Status
'user-status'            // User status update
'message-delivered'      // Message delivery confirmation
'message-read'           // Message read confirmation
```

## 🎨 Key Components

### Frontend Components

#### ChatWindow Component
```typescript
interface ChatWindowProps {
  chatId: string;
  messages: Message[];
  onSendMessage: (content: string) => void;
}
```

#### MessageBubble Component
```typescript
interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  onEdit?: (messageId: string, content: string) => void;
  onDelete?: (messageId: string) => void;
}
```

## 🛡️ Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - Bcrypt for secure password storage
- **Input Validation** - Comprehensive request validation
- **Rate Limiting** - Prevent spam and abuse
- **CORS Configuration** - Secure cross-origin requests
- **File Upload Security** - Safe file handling and validation
- **XSS Protection** - Input sanitization and output encoding

## 📊 Available Scripts

### Backend Scripts
```bash
npm run dev          # Start development server with nodemon
npm run start        # Start production server
npm run test         # Run test suite
npm run lint         # Run ESLint
npm run build        # Build for production
```

### Frontend Scripts
```bash
npm run dev          # Start Vite development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run Vitest tests
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler check
```

## 🚀 Deployment

### Using Docker

1. **Build and run with Docker Compose**
   ```bash
   docker-compose up --build
   ```

2. **Environment variables for production**
   ```env
   NODE_ENV=production
   MONGODB_URI=your-production-mongodb-uri
   CORS_ORIGIN=https://your-frontend-domain.com
   ```

### Manual Deployment

#### Backend (Node.js)
1. **Build the application**
   ```bash
   cd backend
   npm run build
   ```

2. **Deploy to platforms like:**
   - **Heroku**: `git push heroku main`
   - **Railway**: Connect GitHub repository
   - **DigitalOcean**: Use App Platform
   - **AWS**: EC2 or Elastic Beanstalk

#### Frontend (React)
1. **Build the application**
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy to platforms like:**
   - **Vercel**: `vercel --prod`
   - **Netlify**: Drag and drop `dist` folder
   - **AWS S3**: Upload build files to S3 bucket
   - **GitHub Pages**: Use GitHub Actions

### Production Environment Variables

#### Backend (.env)
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chatapp
JWT_SECRET=your-super-secure-jwt-secret-for-production
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CORS_ORIGIN=https://your-frontend-domain.com
```

#### Frontend (.env)
```env
VITE_API_URL=https://your-backend-domain.com
VITE_SOCKET_URL=https://your-backend-domain.com
VITE_APP_NAME=ChatApp
```

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm run test

# Run specific test files
npm run test -- --grep "Auth"
npm run test -- --grep "Chat"
```

### Frontend Testing
```bash
cd frontend
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 🔍 Performance Optimization

### Backend Optimizations
- **Database Indexing** - Optimized MongoDB queries
- **Connection Pooling** - Efficient database connections
- **Caching** - Redis for session and data caching
- **Compression** - Gzip compression for responses
- **Rate Limiting** - Prevent excessive requests

### Frontend Optimizations
- **Code Splitting** - Lazy loading of components
- **Bundle Optimization** - Tree shaking and minification
- **Image Optimization** - WebP format and lazy loading
- **Memoization** - React.memo for expensive components
- **Virtual Scrolling** - Efficient rendering of large lists

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
   - Follow the existing code style
   - Add tests for new features
   - Update documentation as needed
4. **Commit your changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```
5. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
6. **Open a Pull Request**

### Development Guidelines
- Use TypeScript for type safety
- Follow ESLint rules
- Write meaningful commit messages
- Add tests for new functionality
- Update README for significant changes

## 📚 Documentation

- **[API Documentation](docs/API.md)** - Detailed API endpoint documentation
- **[Socket Events](docs/SOCKET_EVENTS.md)** - Complete socket event reference
- **[Database Schema](docs/DATABASE.md)** - MongoDB collection schemas
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Step-by-step deployment instructions

## 🔧 Troubleshooting

### Common Issues

#### Backend Issues
- **MongoDB Connection**: Ensure MongoDB is running and connection string is correct
- **Port Conflicts**: Change PORT in .env if 5000 is occupied
- **JWT Errors**: Check JWT_SECRET is set correctly

#### Frontend Issues
- **API Connection**: Verify VITE_API_URL matches backend URL
- **Socket Connection**: Check VITE_SOCKET_URL configuration
- **Build Errors**: Clear node_modules and reinstall dependencies

#### Socket.IO Issues
- **Connection Failures**: Check CORS configuration
- **Message Delays**: Verify WebSocket support
- **Room Joining**: Ensure proper authentication

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Socket.IO](https://socket.io/) for real-time communication
- [MongoDB](https://www.mongodb.com/) for flexible data storage
- [React](https://react.dev/) team for the amazing frontend library
- [Express.js](https://expressjs.com/) for the robust backend framework
- [Tailwind CSS](https://tailwindcss.com/) for utility-first styling

## 📞 Support & Community

- **Issues**: [GitHub Issues](https://github.com/yourusername/realtime-chat-app/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/realtime-chat-app/discussions)
- **Discord**: [Join our Discord community](https://discord.gg/your-invite)
- **Email**: support@chatapp.com

## 🗺️ Roadmap

- [ ] **Mobile Apps** - React Native iOS and Android apps
- [ ] **Video Calls** - WebRTC integration for video chat
- [ ] **Voice Messages** - Audio message support
- [ ] **Message Translation** - Multi-language support
- [ ] **Bot Integration** - Chatbot and automation features
- [ ] **Screen Sharing** - Share screen during conversations
- [ ] **Advanced Moderation** - Admin tools and content filtering
- [ ] **Custom Themes** - User-customizable chat themes

---

<div align="center">
  <p>Built with ❤️ using the MERN Stack</p>
  <p>
    <a href="https://github.com/yourusername/realtime-chat-app/stargazers">⭐ Star us on GitHub</a> |
    <a href="https://twitter.com/chatapp">🐦 Follow us on Twitter</a> |
    <a href="https://chatapp.com">🌐 Visit our website</a>
  </p>
</div>
