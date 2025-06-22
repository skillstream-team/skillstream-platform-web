# SkillStream LMS Frontend

A comprehensive Learning Management System (LMS) frontend built with React, TypeScript, and Tailwind CSS. This application provides a modern, responsive interface for managing courses, lessons, assessments, and real-time communication features.

## 🚀 Features

### Core LMS Features
- **Course Management**: Create, edit, and manage courses with rich content
- **Lesson System**: Organize lessons with scheduling and video integration
- **Assessment Tools**: Quizzes and assignments with automated grading
- **Progress Tracking**: Monitor student progress and completion rates
- **User Management**: Role-based access (Student, Teacher, Admin)
- **File Management**: Upload and organize course materials

### Real-Time Communication
- **Direct Messaging**: Send and receive private messages between users
- **Course Announcements**: Teachers can post announcements to enrolled students
- **Real-Time Chat**: Live chat during video calls and course discussions
- **WebSocket Integration**: Real-time updates and notifications

### Video Conferencing
- **Video Calls**: High-quality video conferencing with WebRTC
- **Screen Sharing**: Share your screen during video sessions
- **Recording**: Record video sessions (teachers only)
- **Participant Management**: Mute, video controls, hand raising
- **Reactions**: Send emoji reactions during video calls
- **Waiting Room**: Control who can join video sessions

### Advanced Features
- **AI Integration**: AI-powered recommendations and chat assistance
- **Analytics Dashboard**: Comprehensive learning analytics
- **Calendar Integration**: Schedule and manage events
- **Offline Support**: Access content without internet connection
- **Enterprise Features**: Multi-tenant support and SSO integration
- **Mobile Responsive**: Optimized for all device sizes

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Headless UI, Radix UI
- **State Management**: Zustand
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Real-Time**: WebSocket, Socket.io
- **Video**: WebRTC, MediaDevices API
- **Icons**: Lucide React
- **Forms**: React Hook Form, Zod validation
- **Charts**: Recharts
- **Animations**: Framer Motion

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cursor-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   VITE_API_URL=http://localhost:3000/api
   VITE_WS_URL=ws://localhost:3000/ws
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## 🏗️ Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── layout/          # Layout components (Header, Layout)
│   ├── messaging/       # Messaging and chat components
│   ├── video/           # Video call components
│   └── notifications/   # Notification system
├── pages/               # Page components
│   ├── auth/           # Authentication pages
│   ├── courses/        # Course-related pages
│   └── admin/          # Admin pages
├── services/            # API and WebSocket services
├── store/              # State management (Zustand)
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── hooks/              # Custom React hooks
```

## 🔧 Configuration

### API Configuration
The frontend connects to a Node.js/Express backend with the following endpoints:

- **Authentication**: `/api/auth/*`
- **Courses**: `/api/courses/*`
- **Lessons**: `/api/lessons/*`
- **Assessments**: `/api/assessments/*`
- **Communication**: `/api/messages`, `/api/announcements`
- **Video Calls**: `/api/video/*`
- **WebSocket**: `ws://localhost:3000/ws`

### WebSocket Events
The application handles real-time events through WebSocket:

- **NOTIFICATION**: System notifications
- **CHAT**: Course chat messages
- **VIDEO**: Video call updates
- **MESSAGE**: Direct messages
- **PRESENCE**: User online status
- **PROGRESS**: Learning progress updates

## 🎯 Key Components

### Messaging System
- **MessagingPanel**: Modal for direct messages and announcements
- **Real-time updates**: Instant message delivery via WebSocket
- **User selection**: Choose recipients for direct messages
- **Course announcements**: Teachers can post to enrolled students

### Video Conferencing
- **VideoCall**: Full-featured video conferencing component
- **WebRTC integration**: Peer-to-peer video/audio streaming
- **Screen sharing**: Share desktop or application windows
- **Recording**: Capture video sessions for later review
- **Participant controls**: Mute, video, hand raise, reactions

### Notification System
- **Toast notifications**: Real-time alerts for various events
- **Connection status**: WebSocket connection indicators
- **Message notifications**: New message alerts
- **Video call alerts**: Join/leave notifications

## 🔐 Authentication

The application uses JWT-based authentication:

1. **Login**: Email/password authentication
2. **Registration**: New user signup with role selection
3. **Token Management**: Automatic token refresh and storage
4. **Protected Routes**: Role-based access control
5. **Auto-logout**: Session expiration handling

## 📱 Responsive Design

The application is fully responsive and optimized for:

- **Desktop**: Full-featured interface with sidebar navigation
- **Tablet**: Adaptive layout with touch-friendly controls
- **Mobile**: Streamlined interface for small screens
- **Video calls**: Optimized for mobile video conferencing

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Environment Variables for Production
```env
VITE_API_URL=https://your-api-domain.com/api
VITE_WS_URL=wss://your-api-domain.com/ws
```

### Deployment Options
- **Vercel**: Zero-config deployment
- **Netlify**: Static site hosting
- **AWS S3**: Static website hosting
- **Docker**: Containerized deployment

## 🔧 Development

### Available Scripts
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run lint`: Run ESLint

### Code Style
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting
- **Conventional Commits**: Git commit message format

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the code examples

## 🔮 Roadmap

- [ ] Advanced video features (virtual backgrounds, filters)
- [ ] Mobile app (React Native)
- [ ] Advanced analytics and reporting
- [ ] Integration with external LMS platforms
- [ ] Multi-language support
- [ ] Accessibility improvements
- [ ] Performance optimizations

---

Built with ❤️ by the SkillStream team # cursor-frontend
