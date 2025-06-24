# The Watchtower LMS Frontend

A modern, responsive learning management system built with React, TypeScript, and Tailwind CSS. The Watchtower provides a comprehensive platform for online education with advanced features including real-time collaboration, AI-powered insights, and business intelligence capabilities.

## 🚀 Features

- **Modern UI/UX**: Built with React 18, TypeScript, and Tailwind CSS
- **Real-time Collaboration**: WebSocket-powered messaging and video calls
- **AI Integration**: ChatGPT-powered learning assistance and content generation
- **Business Intelligence**: Advanced analytics and reporting dashboard
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Dark Mode**: Beautiful dark/light theme switching
- **Accessibility**: WCAG 2.1 compliant with keyboard navigation
- **PWA Ready**: Progressive Web App capabilities
- **Offline Support**: Works without internet connection
- **File Management**: Advanced file sharing and collaboration tools
- **Assessment Tools**: Quizzes, assignments, and progress tracking
- **Calendar Integration**: Event scheduling and management
- **Forum System**: Community-driven discussions and Q&A
- **Study Groups**: Collaborative learning spaces
- **Video Conferencing**: Built-in video calls and screen sharing
- **Notifications**: Real-time alerts and updates
- **Multi-language Support**: Internationalization ready
- **Analytics Dashboard**: Comprehensive learning analytics
- **Admin Panel**: Advanced user and content management
- **API Integration**: RESTful API with WebSocket support

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **State Management**: Zustand, Redux Toolkit
- **Routing**: React Router v6
- **UI Components**: Radix UI, Lucide Icons
- **Styling**: Tailwind CSS, CSS Modules
- **HTTP Client**: Axios
- **Real-time**: WebSocket, Socket.io
- **Build Tool**: Vite
- **Testing**: Jest, React Testing Library
- **Linting**: ESLint, Prettier
- **Type Checking**: TypeScript

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/watchtower-frontend.git
   cd watchtower-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your configuration:
   ```env
   VITE_API_URL=http://localhost:3000/api
   VITE_WS_URL=ws://localhost:3000
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ai/             # AI-powered features
│   ├── calendar/       # Calendar and scheduling
│   ├── collaboration/  # Study groups and forums
│   ├── common/         # Shared components
│   ├── course-builder/ # Course creation tools
│   ├── dashboard/      # Dashboard widgets
│   ├── file-management/# File handling
│   ├── forum/          # Discussion forums
│   ├── layout/         # Layout components
│   ├── messaging/      # Chat and messaging
│   ├── notifications/  # Notification system
│   ├── offline/        # Offline functionality
│   ├── progress/       # Progress tracking
│   ├── upload/         # File upload
│   └── video/          # Video conferencing
├── pages/              # Page components
│   ├── admin/          # Admin pages
│   ├── assessments/    # Quiz and assignment pages
│   ├── auth/           # Authentication pages
│   └── courses/        # Course-related pages
├── services/           # API and external services
├── store/              # State management
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## 🎯 Key Features

### 🧠 AI-Powered Learning
- **Smart Recommendations**: AI suggests courses based on learning patterns
- **Content Generation**: Generate quizzes, summaries, and explanations
- **Personalized Tutoring**: One-on-one AI tutoring sessions
- **Code Review**: Automated code analysis and feedback
- **Learning Paths**: AI-generated personalized learning journeys

### 📊 Business Intelligence
- **Real-time Analytics**: Live dashboard with key metrics
- **Revenue Tracking**: Comprehensive financial insights
- **User Engagement**: Detailed user behavior analysis
- **Course Performance**: Track course success metrics
- **Predictive Analytics**: AI-powered trend predictions

### 🤝 Collaboration Tools
- **Real-time Messaging**: Instant communication between users
- **Video Conferencing**: Built-in video calls with screen sharing
- **Study Groups**: Collaborative learning spaces
- **Forum Discussions**: Community-driven Q&A
- **File Sharing**: Advanced file management and sharing

### 📱 Modern UX
- **Responsive Design**: Works on all devices
- **Dark Mode**: Beautiful theme switching
- **Accessibility**: WCAG 2.1 compliant
- **PWA Features**: Install as native app
- **Offline Support**: Works without internet

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run type-check` - Run TypeScript type checking
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode

### Code Quality

- **TypeScript**: Strict type checking enabled
- **ESLint**: Code linting with custom rules
- **Prettier**: Code formatting
- **Husky**: Git hooks for quality checks
- **Commitlint**: Conventional commit messages

## 🌐 API Integration

The frontend integrates with a comprehensive REST API:

- **Authentication**: JWT-based auth with refresh tokens
- **Real-time**: WebSocket for live updates
- **File Upload**: Multipart upload with progress
- **Search**: Full-text search across content
- **Analytics**: Real-time data streaming

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Environment Variables
```env
VITE_API_URL=https://api.watchtower.com
VITE_WS_URL=wss://api.watchtower.com
VITE_APP_NAME=The Watchtower
```

### Docker Deployment
```bash
docker build -t watchtower-frontend .
docker run -p 80:80 watchtower-frontend
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **React Team** for the amazing framework
- **Tailwind CSS** for the utility-first CSS framework
- **Vite** for the fast build tool
- **Radix UI** for accessible components
- **Lucide** for beautiful icons

---

Built with ❤️ by The Watchtower team
