import React, { useState, useEffect, useRef } from 'react';
import { VideoConference, VideoParticipant, VideoSession } from '../../types';
import { apiService } from '../../services/api';
import { 
  VideoCameraIcon,
  VideoCameraSlashIcon,
  MicrophoneIcon,
  PhoneIcon,
  PhoneXMarkIcon,
  ComputerDesktopIcon,
  HandRaisedIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  HeartIcon,
  FaceSmileIcon,
  Cog6ToothIcon,
  UsersIcon,
  ChatBubbleLeftIcon,
  VideoCameraIcon as RecordIcon,
  VideoCameraSlashIcon as StopRecordIcon
} from '@heroicons/react/24/outline';

interface VideoCallProps {
  conferenceId: string;
  onLeave: () => void;
}

const VideoCall: React.FC<VideoCallProps> = ({ conferenceId, onLeave }) => {
  const [conference, setConference] = useState<VideoConference | null>(null);
  const [session, setSession] = useState<VideoSession | null>(null);
  const [participants, setParticipants] = useState<VideoParticipant[]>([]);
  const [localParticipant, setLocalParticipant] = useState<VideoParticipant | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const screenShareRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    joinConference();
    return () => {
      leaveConference();
    };
  }, [conferenceId]);

  useEffect(() => {
    if (conference) {
      const interval = setInterval(updateParticipants, 5000);
      return () => clearInterval(interval);
    }
  }, [conference]);

  const joinConference = async () => {
    try {
      setLoading(true);
      const result = await apiService.joinVideoConference(conferenceId);
      setConference(result.conference);
      setLocalParticipant(result.participant);
      setSession(result.session);
      setParticipants(result.session.participants);
      setIsMuted(result.participant.isMuted);
      setIsVideoOn(result.participant.isVideoOn);
      setIsHandRaised(result.participant.isHandRaised);
      
      // Initialize local video stream
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: isVideoOn,
          audio: !isMuted
        });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      }
    } catch (error) {
      console.error('Failed to join conference:', error);
      setError('Failed to join video conference');
    } finally {
      setLoading(false);
    }
  };

  const leaveConference = async () => {
    try {
      if (conference) {
        await apiService.leaveVideoConference(conferenceId);
      }
    } catch (error) {
      console.error('Failed to leave conference:', error);
    }
    onLeave();
  };

  const updateParticipants = async () => {
    try {
      const result = await apiService.getVideoParticipants(conferenceId);
      setParticipants(result.participants);
    } catch (error) {
      console.error('Failed to update participants:', error);
    }
  };

  const toggleMute = async () => {
    try {
      const newMutedState = !isMuted;
      await apiService.updateVideoStatus(conferenceId, { isMuted: newMutedState });
      setIsMuted(newMutedState);
      
      // Update local audio stream
      if (localVideoRef.current?.srcObject) {
        const stream = localVideoRef.current.srcObject as MediaStream;
        stream.getAudioTracks().forEach(track => {
          track.enabled = !newMutedState;
        });
      }
    } catch (error) {
      console.error('Failed to toggle mute:', error);
    }
  };

  const toggleVideo = async () => {
    try {
      const newVideoState = !isVideoOn;
      await apiService.updateVideoStatus(conferenceId, { isVideoOn: newVideoState });
      setIsVideoOn(newVideoState);
      
      // Update local video stream
      if (localVideoRef.current?.srcObject) {
        const stream = localVideoRef.current.srcObject as MediaStream;
        stream.getVideoTracks().forEach(track => {
          track.enabled = newVideoState;
        });
      }
    } catch (error) {
      console.error('Failed to toggle video:', error);
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false
        });
        
        if (screenShareRef.current) {
          screenShareRef.current.srcObject = screenStream;
        }
        setIsScreenSharing(true);
      } else {
        if (screenShareRef.current?.srcObject) {
          const stream = screenShareRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
          screenShareRef.current.srcObject = null;
        }
        setIsScreenSharing(false);
      }
    } catch (error) {
      console.error('Failed to toggle screen share:', error);
    }
  };

  const toggleRecording = async () => {
    try {
      const action = isRecording ? 'stop' : 'start';
      await apiService.controlVideoRecording(conferenceId, action);
      setIsRecording(!isRecording);
    } catch (error) {
      console.error('Failed to toggle recording:', error);
    }
  };

  const toggleHandRaise = async () => {
    try {
      const newHandRaisedState = !isHandRaised;
      await apiService.updateVideoStatus(conferenceId, { isHandRaised: newHandRaisedState });
      setIsHandRaised(newHandRaisedState);
    } catch (error) {
      console.error('Failed to toggle hand raise:', error);
    }
  };

  const sendReaction = async (reaction: string) => {
    try {
      await apiService.sendVideoReaction(conferenceId, reaction);
    } catch (error) {
      console.error('Failed to send reaction:', error);
    }
  };

  const sendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    try {
      // This would need to be implemented in the API service
      // await apiService.sendVideoChatMessage(conferenceId, chatMessage);
      setChatMessages(prev => [...prev, {
        id: Date.now(),
        message: chatMessage,
        sender: localParticipant?.name || 'You',
        timestamp: new Date().toISOString()
      }]);
      setChatMessage('');
    } catch (error) {
      console.error('Failed to send chat message:', error);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Joining video conference...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={onLeave}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Leave Conference
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-white font-medium">
            {conference?.provider} Meeting
          </h1>
          <div className="flex items-center space-x-2 text-sm text-gray-300">
            <UsersIcon className="w-4 h-4" />
            <span>{participants.length} participants</span>
          </div>
          {isRecording && (
            <div className="flex items-center space-x-2 text-red-400">
              <RecordIcon className="w-4 h-4" />
              <span className="text-sm">Recording</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-300 hover:text-white rounded-md hover:bg-gray-700"
          >
            <Cog6ToothIcon className="w-5 h-5" />
          </button>
          <button
            onClick={leaveConference}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center space-x-2"
          >
            <PhoneXMarkIcon className="w-4 h-4" />
            <span>Leave</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Video Area */}
        <div className="flex-1 relative">
          {/* Main Video */}
          <div className="absolute inset-0 flex items-center justify-center">
            {isScreenSharing ? (
              <video
                ref={screenShareRef}
                autoPlay
                playsInline
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <div className="grid grid-cols-2 gap-4 p-4 w-full h-full">
                {/* Local Video */}
                <div className="relative bg-gray-800 rounded-lg overflow-hidden">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {!isVideoOn && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                      <VideoCameraSlashIcon className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                    You {isMuted && '(Muted)'}
                  </div>
                </div>

                {/* Remote Videos */}
                {participants.filter(p => p.id !== localParticipant?.id).map((participant) => (
                  <div key={participant.id} className="relative bg-gray-800 rounded-lg overflow-hidden">
                    <video
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    {!participant.isVideoOn && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                        <VideoCameraSlashIcon className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                      {participant.name} {participant.isMuted && '(Muted)'}
                    </div>
                    {participant.isHandRaised && (
                      <div className="absolute top-2 right-2 bg-yellow-500 p-1 rounded-full">
                        <HandRaisedIcon className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reactions Overlay */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
            <button
              onClick={() => sendReaction('👍')}
              className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30"
            >
              <HandThumbUpIcon className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={() => sendReaction('👎')}
              className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30"
            >
              <HandThumbDownIcon className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={() => sendReaction('❤️')}
              className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30"
            >
              <HeartIcon className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={() => sendReaction('😊')}
              className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30"
            >
              <FaceSmileIcon className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Sidebar */}
        {(showChat || showParticipants) && (
          <div className="w-80 bg-gray-800 border-l border-gray-700">
            {showChat && (
              <div className="h-full flex flex-col">
                <div className="p-4 border-b border-gray-700">
                  <h3 className="text-white font-medium">Chat</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className="bg-gray-700 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-white">{msg.sender}</span>
                        <span className="text-xs text-gray-400">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300">{msg.message}</p>
                    </div>
                  ))}
                </div>
                <form onSubmit={sendChatMessage} className="p-4 border-t border-gray-700">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Send
                    </button>
                  </div>
                </form>
              </div>
            )}

            {showParticipants && (
              <div className="h-full flex flex-col">
                <div className="p-4 border-b border-gray-700">
                  <h3 className="text-white font-medium">Participants ({participants.length})</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  {participants.map((participant) => (
                    <div key={participant.id} className="flex items-center space-x-3 py-2">
                      <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {participant.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-sm">{participant.name}</p>
                        <p className="text-gray-400 text-xs">{participant.role}</p>
                      </div>
                      <div className="flex items-center space-x-1">
                        {participant.isMuted && (
                          <MicrophoneIcon className="w-4 h-4 text-red-400" />
                        )}
                        {participant.isHandRaised && (
                          <HandRaisedIcon className="w-4 h-4 text-yellow-400" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-4">
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={toggleMute}
            className={`p-3 rounded-full ${
              isMuted ? 'bg-red-600 text-white' : 'bg-gray-600 text-white hover:bg-gray-500'
            }`}
          >
            {isMuted ? <MicrophoneIcon className="w-6 h-6" /> : <MicrophoneIcon className="w-6 h-6" />}
          </button>

          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full ${
              !isVideoOn ? 'bg-red-600 text-white' : 'bg-gray-600 text-white hover:bg-gray-500'
            }`}
          >
            {!isVideoOn ? <VideoCameraSlashIcon className="w-6 h-6" /> : <VideoCameraIcon className="w-6 h-6" />}
          </button>

          <button
            onClick={toggleScreenShare}
            className={`p-3 rounded-full ${
              isScreenSharing ? 'bg-blue-600 text-white' : 'bg-gray-600 text-white hover:bg-gray-500'
            }`}
          >
            {isScreenSharing ? <ComputerDesktopIcon className="w-6 h-6" /> : <ComputerDesktopIcon className="w-6 h-6" />}
          </button>

          <button
            onClick={toggleHandRaise}
            className={`p-3 rounded-full ${
              isHandRaised ? 'bg-yellow-600 text-white' : 'bg-gray-600 text-white hover:bg-gray-500'
            }`}
          >
            <HandRaisedIcon className="w-6 h-6" />
          </button>

          <button
            onClick={toggleRecording}
            className={`p-3 rounded-full ${
              isRecording ? 'bg-red-600 text-white' : 'bg-gray-600 text-white hover:bg-gray-500'
            }`}
          >
            {isRecording ? <StopRecordIcon className="w-6 h-6" /> : <RecordIcon className="w-6 h-6" />}
          </button>

          <button
            onClick={() => setShowChat(!showChat)}
            className={`p-3 rounded-full ${
              showChat ? 'bg-blue-600 text-white' : 'bg-gray-600 text-white hover:bg-gray-500'
            }`}
          >
            <ChatBubbleLeftIcon className="w-6 h-6" />
          </button>

          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className={`p-3 rounded-full ${
              showParticipants ? 'bg-blue-600 text-white' : 'bg-gray-600 text-white hover:bg-gray-500'
            }`}
          >
            <UsersIcon className="w-6 h-6" />
          </button>

          <button
            onClick={leaveConference}
            className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700"
          >
            <PhoneXMarkIcon className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCall; 