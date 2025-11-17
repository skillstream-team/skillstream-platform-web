import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { 
  Phone, 
  Video, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  Settings,
  User,
  Clock
} from 'lucide-react';
import { BackButton } from '../components/common/BackButton';

interface CallState {
  isConnected: boolean;
  isMuted: boolean;
  isSpeakerOn: boolean;
  duration: number;
  isIncoming: boolean;
  isRinging: boolean;
}

const CallsPage: React.FC = () => {
  const { contactId } = useParams<{ contactId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [callState, setCallState] = useState<CallState>({
    isConnected: false,
    isMuted: false,
    isSpeakerOn: true,
    duration: 0,
    isIncoming: false,
    isRinging: true
  });

  const [contact, setContact] = useState<{
    id: string;
    name: string;
    avatar?: string;
    isOnline: boolean;
  } | null>(null);

  const callType = location.state?.callType || 'audio';
  const contactName = location.state?.contactName || 'Unknown Contact';

  useEffect(() => {
    // Simulate contact data
    setContact({
      id: contactId || 'unknown',
      name: contactName,
      avatar: `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80`,
      isOnline: true
    });

    // Simulate call connection after 2 seconds
    const timer = setTimeout(() => {
      setCallState(prev => ({
        ...prev,
        isConnected: true,
        isRinging: false
      }));
    }, 2000);

    return () => clearTimeout(timer);
  }, [contactId, contactName]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (callState.isConnected) {
      interval = setInterval(() => {
        setCallState(prev => ({
          ...prev,
          duration: prev.duration + 1
        }));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callState.isConnected]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleMute = () => {
    setCallState(prev => ({
      ...prev,
      isMuted: !prev.isMuted
    }));
  };

  const handleToggleSpeaker = () => {
    setCallState(prev => ({
      ...prev,
      isSpeakerOn: !prev.isSpeakerOn
    }));
  };

  const handleEndCall = () => {
    setCallState(prev => ({
      ...prev,
      isConnected: false,
      isRinging: false
    }));
    
    // Navigate back after a short delay
    setTimeout(() => {
      navigate(-1);
    }, 500);
  };

  const handleAnswerCall = () => {
    setCallState(prev => ({
      ...prev,
      isConnected: true,
      isRinging: false,
      isIncoming: false
    }));
  };

  const handleRejectCall = () => {
    setCallState(prev => ({
      ...prev,
      isConnected: false,
      isRinging: false,
      isIncoming: false
    }));
    
    setTimeout(() => {
      navigate(-1);
    }, 500);
  };

  if (!contact) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <BackButton />
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {callType === 'video' ? 'Video Call' : 'Audio Call'}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {contact.name}
                </p>
              </div>
            </div>
            {callState.isConnected && (
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <Clock className="h-4 w-4" />
                <span>{formatDuration(callState.duration)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          {/* Contact Info */}
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center overflow-hidden mx-auto mb-4">
                {contact.avatar ? (
                  <img
                    src={contact.avatar}
                    alt={contact.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-gray-500" />
                )}
              </div>
              {contact.isOnline && (
                <div className="absolute bottom-4 right-4 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              )}
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {contact.name}
            </h2>
            
            {callState.isRinging && !callState.isConnected && (
              <div className="flex items-center justify-center space-x-2 text-blue-600 dark:text-blue-400">
                <div className="animate-pulse">
                  <Phone className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">Calling...</span>
              </div>
            )}
            
            {callState.isConnected && (
              <div className="flex items-center justify-center space-x-2 text-green-600 dark:text-green-400">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Connected</span>
              </div>
            )}
          </div>

          {/* Call Controls */}
          <div className="flex items-center justify-center space-x-6 mb-8">
            {/* Mute Button */}
            <button
              onClick={handleToggleMute}
              className={`p-4 rounded-full transition-colors ${
                callState.isMuted
                  ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title={callState.isMuted ? 'Unmute' : 'Mute'}
            >
              {callState.isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </button>

            {/* Speaker Button */}
            <button
              onClick={handleToggleSpeaker}
              className={`p-4 rounded-full transition-colors ${
                callState.isSpeakerOn
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title={callState.isSpeakerOn ? 'Speaker Off' : 'Speaker On'}
            >
              {callState.isSpeakerOn ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
            </button>

            {/* Settings Button */}
            <button
              className="p-4 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="Call Settings"
            >
              <Settings className="h-6 w-6" />
            </button>
          </div>

          {/* Main Action Buttons */}
          <div className="flex items-center justify-center space-x-6">
            {callState.isRinging && !callState.isConnected ? (
              <>
                {/* Answer Call Button */}
                <button
                  onClick={handleAnswerCall}
                  className="p-6 rounded-full bg-green-600 text-white hover:bg-green-700 transition-colors"
                  title="Answer Call"
                >
                  {callType === 'video' ? <Video className="h-8 w-8" /> : <Phone className="h-8 w-8" />}
                </button>

                {/* Reject Call Button */}
                <button
                  onClick={handleRejectCall}
                  className="p-6 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
                  title="Reject Call"
                >
                  <PhoneOff className="h-8 w-8" />
                </button>
              </>
            ) : (
              /* End Call Button */
              <button
                onClick={handleEndCall}
                className="p-6 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
                title="End Call"
              >
                <PhoneOff className="h-8 w-8" />
              </button>
            )}
          </div>

          {/* Call Type Indicator */}
          <div className="text-center mt-6">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full">
              {callType === 'video' ? (
                <Video className="h-4 w-4 text-blue-600" />
              ) : (
                <Phone className="h-4 w-4 text-blue-600" />
              )}
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {callType === 'video' ? 'Video Call' : 'Audio Call'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallsPage; 
