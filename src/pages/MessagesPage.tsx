import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { 
  MessageCircle, 
  Search, 
  Send, 
  MoreVertical, 
  Phone, 
  Video, 
  Paperclip, 
  CheckCheck,
  Plus,
  File,
  X,
  ArrowLeft
} from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { BackButton } from '../components/common/BackButton';
import { AttachmentMenu, Attachment } from '../components/messaging/AttachmentMenu';
import { 
  getUsers, 
  getConversations, 
  createConversation,
  getMessages,
  sendMessage,
  markConversationAsRead,
  uploadMessageFile,
  addMessageReaction,
  removeMessageReaction
} from '../services/api';
import { Conversation, Message } from '../types';
import { messagingSocketService } from '../services/messagingSocket';
import { fileToBase64, formatFileSize } from '../utils/fileUtils';

export const MessagesPage: React.FC = () => {
  const { user, token } = useAuthStore();
  const location = useLocation();
  const params = useParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [isNewMessageMode, setIsNewMessageMode] = useState(false);
  const [selectedUserForNew, setSelectedUserForNew] = useState<any | null>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const attachmentButtonRef = useRef<HTMLButtonElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  // Initialize Socket.IO connection
  useEffect(() => {
    if (user && token) {
      messagingSocketService.connect(token, user.id);
      setIsSocketConnected(messagingSocketService.isConnected());

      // Listen for new messages
      const handleNewMessage = (message: Message) => {
        if (selectedConversation && message.conversationId === selectedConversation.id) {
          setMessages(prev => [...prev, message]);
          scrollToBottom();
        }
        // Update conversation list
        loadConversations();
      };

      // Listen for typing indicators
      const handleTyping = (data: { conversationId: string; userId: string; isTyping: boolean }) => {
        if (selectedConversation && data.conversationId === selectedConversation.id) {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            if (data.isTyping) {
              newSet.add(data.userId);
            } else {
              newSet.delete(data.userId);
            }
            return newSet;
          });
        }
      };

      // Listen for read receipts
      const handleRead = (data: { conversationId?: string; messageId?: string; userId: string; readAt: string }) => {
        if (data.conversationId && selectedConversation && data.conversationId === selectedConversation.id) {
          // Update messages with read receipts
          setMessages(prev => prev.map(msg => {
            if (data.messageId && msg.id === data.messageId) {
              return {
                ...msg,
                readBy: [...(msg.readBy || []), {
                  id: '',
                  userId: data.userId,
                  user: { id: data.userId, username: '', email: '' },
                  readAt: data.readAt
                }]
              };
            }
            return msg;
          }));
        }
      };

      // Listen for reactions
      const handleReaction = (data: { messageId: string; message: Message }) => {
        if (selectedConversation && data.message.conversationId === selectedConversation.id) {
          setMessages(prev => prev.map(msg => 
            msg.id === data.messageId ? data.message : msg
          ));
        }
      };

      messagingSocketService.onMessage(handleNewMessage);
      messagingSocketService.onTyping(handleTyping);
      messagingSocketService.onRead(handleRead);
      messagingSocketService.onReaction(handleReaction);

      return () => {
        messagingSocketService.offMessage(handleNewMessage);
        messagingSocketService.offTyping(handleTyping);
        messagingSocketService.offRead(handleRead);
        messagingSocketService.offReaction(handleReaction);
        messagingSocketService.disconnect();
      };
    }
  }, [user, token, selectedConversation]);

  useEffect(() => {
    loadConversations();
    loadUsers();
    
    if (location.pathname.includes('/new')) {
      setIsNewMessageMode(true);
    }
    
    if (params.conversationId) {
      loadConversation(params.conversationId);
    }
  }, [location.pathname, params.conversationId]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages();
      markConversationAsRead(selectedConversation.id);
      messagingSocketService.joinConversation(selectedConversation.id, user?.id || '');
    }
    return () => {
      if (selectedConversation) {
        messagingSocketService.leaveConversation(selectedConversation.id);
      }
    };
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const filtered = conversations.filter(conv => {
      if (!searchQuery) return true;
      const searchLower = searchQuery.toLowerCase();
      if (conv.name?.toLowerCase().includes(searchLower)) return true;
      if (conv.description?.toLowerCase().includes(searchLower)) return true;
      return conv.participants.some(p => 
        p.user.username.toLowerCase().includes(searchLower) ||
        p.user.email.toLowerCase().includes(searchLower)
      );
    });
    setFilteredConversations(filtered);
  }, [searchQuery, conversations]);

  const loadConversations = async () => {
    try {
      const result = await getConversations({ limit: 100 });
      setConversations(result.data);
      setFilteredConversations(result.data);
    } catch (error) {
      console.error('Error loading conversations:', error);
      setConversations([]);
    }
  };

  const loadConversation = async (conversationId: string) => {
    try {
      const conv = conversations.find(c => c.id === conversationId);
      if (conv) {
        setSelectedConversation(conv);
      } else {
        // Load conversation details if not in list
        const { getConversation } = await import('../services/api');
        const conversation = await getConversation(conversationId);
        setSelectedConversation(conversation);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const loadMessages = async () => {
    if (!selectedConversation) return;
    try {
      setIsLoading(true);
      const result = await getMessages(selectedConversation.id, { limit: 50 });
      setMessages(result.data);
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const usersData = await getUsers();
      setUsers(usersData.filter(u => u.id !== user?.id));
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim() && attachments.length === 0) return;
    if (!selectedConversation && !selectedUserForNew) return;

    try {
      setIsSending(true);

      // Upload attachments first
      const uploadedAttachments = [];
      for (const attachment of attachments) {
        try {
          const base64 = await fileToBase64(attachment.file);
          const uploadResult = await uploadMessageFile({
            file: base64,
            filename: attachment.name,
            contentType: attachment.type || 'application/octet-stream',
            conversationId: selectedConversation?.id
          });
          uploadedAttachments.push({
            filename: uploadResult.filename,
            url: uploadResult.url,
            size: uploadResult.size,
            mimeType: uploadResult.contentType
          });
        } catch (error) {
          console.error('Error uploading attachment:', error);
        }
      }

      let conversationId = selectedConversation?.id;

      // Create conversation if starting new message
      if (!conversationId && selectedUserForNew) {
        const newConv = await createConversation({
          type: 'direct',
          participantIds: [selectedUserForNew.id]
        });
        conversationId = newConv.id;
        setSelectedConversation(newConv);
        setSelectedUserForNew(null);
        setIsNewMessageMode(false);
        await loadConversations();
        messagingSocketService.joinConversation(conversationId, user?.id || '');
      }

      if (!conversationId) return;

      // Send message via REST API (ensures persistence)
      await sendMessage({
        conversationId,
        content: content.trim(),
        type: uploadedAttachments.length > 0 ? 'file' : 'text',
        attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined
      });

      // Also send via Socket.IO for real-time
      messagingSocketService.sendMessage({
        conversationId,
        content: content.trim(),
        type: uploadedAttachments.length > 0 ? 'file' : 'text',
        attachments: uploadedAttachments
      });

      setNewMessage('');
      setAttachments([]);
      await loadMessages();
      await loadConversations();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleCreateConversation = async (userId: string) => {
    try {
      const newConv = await createConversation({
        type: 'direct',
        participantIds: [userId]
      });
      setSelectedConversation(newConv);
      setSelectedUserForNew(null);
      setIsNewMessageMode(false);
      await loadConversations();
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const handleAddReaction = async (messageId: string, emoji: string) => {
    try {
      await addMessageReaction(messageId, emoji);
      messagingSocketService.addReaction(messageId, emoji);
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const handleRemoveReaction = async (messageId: string, emoji: string) => {
    try {
      await removeMessageReaction(messageId, emoji);
      messagingSocketService.removeReaction(messageId, emoji);
    } catch (error) {
      console.error('Error removing reaction:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateString: string) => {
    try {
      if (!dateString) return '';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

      if (diffInHours < 24) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (diffInHours < 48) {
        return 'Yesterday';
      } else {
        return date.toLocaleDateString();
      }
    } catch {
      return '';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(newMessage);
    }
  };

  const handleAttachmentsSelected = (selectedAttachments: Attachment[]) => {
    setAttachments(prev => [...prev, ...selectedAttachments]);
  };

  const removeAttachment = (attachmentId: string) => {
    setAttachments(prev => prev.filter(att => att.id !== attachmentId));
  };

  const getOtherParticipant = (conversation: Conversation) => {
    if (conversation.type === 'direct') {
      return conversation.participants.find(p => p.userId !== user?.id)?.user;
    }
    return null;
  };

  const getConversationName = (conversation: Conversation) => {
    if (conversation.name) return conversation.name;
    if (conversation.type === 'direct') {
      const other = getOtherParticipant(conversation);
      return other?.username || other?.email || 'Unknown User';
    }
    return 'Group Chat';
  };

  const getConversationAvatar = (conversation: Conversation): string | undefined => {
    if (conversation.type === 'direct') {
      const other = getOtherParticipant(conversation);
      return other?.avatarUrl || undefined;
    }
    return undefined;
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F4F7FA' }}>
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-40 backdrop-blur-xl border-b" style={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: 'rgba(11, 30, 63, 0.1)'
      }}>
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BackButton showHome />
              <h1 className="text-lg font-bold" style={{ color: '#0B1E3F' }}>
                Messages
              </h1>
            </div>
            <button
              onClick={() => setIsNewMessageMode(true)}
              className="p-2 rounded-xl transition-all duration-200 active:scale-95"
              style={{ backgroundColor: 'rgba(0, 181, 173, 0.1)' }}
            >
              <Plus className="h-5 w-5" style={{ color: '#00B5AD' }} />
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block bg-white border-b" style={{ borderColor: '#E5E7EB' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <BackButton showHome />
              <div>
                <h1 className="text-2xl font-bold" style={{ color: '#0B1E3F' }}>
                  {isNewMessageMode ? 'New Message' : 'Messages'}
                </h1>
                <p className="text-sm" style={{ color: '#6F73D2' }}>
                  {isNewMessageMode ? 'Start a new conversation' : 'Connect with students and teachers'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {!isNewMessageMode && (
                <button 
                  onClick={() => setIsNewMessageMode(true)}
                  className="flex items-center px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300"
                  style={{ 
                    backgroundColor: '#00B5AD',
                    boxShadow: '0 4px 14px rgba(0, 181, 173, 0.3)'
                  }}
                >
                  <Plus className="h-5 w-5 mr-2" />
                  New Message
                </button>
              )}
              <div 
                className={`w-3 h-3 rounded-full ${isSocketConnected ? 'bg-green-500' : 'bg-red-500'}`} 
                title={isSocketConnected ? 'Connected' : 'Disconnected'} 
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {isNewMessageMode ? (
          // New Message Interface
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 h-[calc(100vh-250px)] flex">
            {/* User Selection */}
            <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Select Recipient
                </h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {users.filter(u => 
                  u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  u.email.toLowerCase().includes(searchQuery.toLowerCase())
                ).map((userItem) => (
                  <div
                    key={userItem.id}
                    onClick={() => {
                      setSelectedUserForNew(userItem);
                      handleCreateConversation(userItem.id);
                    }}
                    className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      selectedUserForNew?.id === userItem.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          {userItem.name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {userItem.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {userItem.email}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Message Composition */}
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Recipient Header */}
                  <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          {getConversationName(selectedConversation).charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          {getConversationName(selectedConversation)}
                        </h3>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setIsNewMessageMode(false);
                        setSelectedConversation(null);
                        setSelectedUserForNew(null);
                        setNewMessage('');
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Message Input */}
                  <div className="flex-1 p-4 flex flex-col">
                    <div className="flex-1 bg-gray-50 dark:bg-gray-700 p-4 mb-4">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your message here..."
                        className="w-full h-full bg-transparent border-none outline-none resize-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        rows={10}
                      />
                    </div>
                    
                    {attachments.length > 0 && (
                      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700">
                        <div className="flex flex-wrap gap-2">
                          {attachments.map((attachment) => (
                            <div
                              key={attachment.id}
                              className="flex items-center space-x-2 p-2 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-600"
                            >
                              {attachment.preview ? (
                                <img
                                  src={attachment.preview}
                                  alt={attachment.name}
                                  className="w-8 h-8 object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-500 flex items-center justify-center">
                                  <File className="h-4 w-4 text-gray-500" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                                  {attachment.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatFileSize(attachment.size)}
                                </p>
                              </div>
                              <button
                                onClick={() => removeAttachment(attachment.id)}
                                className="text-gray-400 hover:text-red-500"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          ref={attachmentButtonRef}
                          onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <Paperclip className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setIsNewMessageMode(false);
                            setSelectedConversation(null);
                            setSelectedUserForNew(null);
                            setNewMessage('');
                          }}
                          className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSendMessage(newMessage)}
                          disabled={(!newMessage.trim() && attachments.length === 0) || isSending}
                          className="flex items-center px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                          {isSending ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <Send className="h-4 w-4 mr-2" />
                          )}
                          Send
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Select a recipient
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      Choose someone from the list to start a new conversation
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Regular Messages Interface - WhatsApp Style
          <div className="flex-1 flex overflow-hidden" style={{ backgroundColor: '#F4F7FA' }}>
            {/* Conversations List */}
            <div className="hidden lg:flex w-80 lg:w-96 border-r flex flex-col" style={{ 
              backgroundColor: 'white',
              borderColor: '#E5E7EB'
            }}>
              <div className="p-4 border-b" style={{ borderColor: '#E5E7EB' }}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5" style={{ color: '#6F73D2' }} />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-200"
                    style={{
                      borderColor: '#E5E7EB',
                      backgroundColor: 'white',
                      color: '#0B1E3F',
                      fontSize: '16px'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#00B5AD';
                      e.currentTarget.style.boxShadow = '0 0 0 4px rgba(0, 181, 173, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#E5E7EB';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {filteredConversations.length > 0 ? (
                  filteredConversations.map((conversation) => {
                    const isSelected = selectedConversation?.id === conversation.id;
                    return (
                      <div
                        key={conversation.id}
                        onClick={() => {
                          setSelectedConversation(conversation);
                          markConversationAsRead(conversation.id);
                        }}
                        className={`p-4 cursor-pointer transition-all duration-200 active:scale-[0.98] ${
                          isSelected ? '' : ''
                        }`}
                        style={{
                          backgroundColor: isSelected ? 'rgba(0, 181, 173, 0.05)' : 'white',
                          borderLeft: isSelected ? '3px solid #00B5AD' : 'none'
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-white font-bold"
                            style={{ 
                              background: 'linear-gradient(135deg, #00B5AD 0%, #6F73D2 100%)'
                            }}
                          >
                            {getConversationAvatar(conversation) ? (
                              <img
                                src={getConversationAvatar(conversation)}
                                alt={getConversationName(conversation)}
                                className="w-full h-full rounded-2xl object-cover"
                              />
                            ) : (
                              <span>{getConversationName(conversation).charAt(0)}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-bold truncate" style={{ color: '#0B1E3F' }}>
                                {getConversationName(conversation)}
                              </p>
                              {conversation.unreadCount > 0 && (
                                <span 
                                  className="ml-2 px-2 py-1 rounded-full text-xs font-bold text-white"
                                  style={{ backgroundColor: '#00B5AD' }}
                                >
                                  {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                                </span>
                              )}
                            </div>
                            {conversation.lastMessage && (
                              <p className="text-xs truncate" style={{ color: '#6F73D2' }}>
                                {conversation.lastMessage.content}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex items-center justify-center h-full p-8">
                    <div className="text-center">
                      <MessageCircle className="h-12 w-12 mx-auto mb-3" style={{ color: '#6F73D2', opacity: 0.5 }} />
                      <p className="text-sm font-semibold" style={{ color: '#0B1E3F' }}>No conversations yet</p>
                      <p className="text-xs mt-1" style={{ color: '#6F73D2' }}>Start a new conversation to get started</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Messages View */}
            <div className="flex-1 flex flex-col" style={{ backgroundColor: '#F4F7FA' }}>
              {selectedConversation ? (
                <>
                  {/* Conversation Header - Sticky */}
                  <div 
                    className="flex items-center justify-between p-4 border-b backdrop-blur-xl"
                    style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      borderColor: '#E5E7EB'
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold flex-shrink-0"
                        style={{ 
                          background: 'linear-gradient(135deg, #00B5AD 0%, #6F73D2 100%)'
                        }}
                      >
                        {getConversationAvatar(selectedConversation) ? (
                          <img
                            src={getConversationAvatar(selectedConversation)}
                            alt={getConversationName(selectedConversation)}
                            className="w-full h-full rounded-2xl object-cover"
                          />
                        ) : (
                          <span>{getConversationName(selectedConversation).charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold" style={{ color: '#0B1E3F' }}>
                          {getConversationName(selectedConversation)}
                        </h3>
                        {selectedConversation.type === 'group' && (
                          <p className="text-xs" style={{ color: '#6F73D2' }}>
                            {selectedConversation.participants.length} participants
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        className="p-2 rounded-xl transition-all duration-200 active:scale-95"
                        style={{ backgroundColor: 'rgba(0, 181, 173, 0.1)' }}
                      >
                        <Phone className="h-5 w-5" style={{ color: '#00B5AD' }} />
                      </button>
                      <button 
                        className="p-2 rounded-xl transition-all duration-200 active:scale-95"
                        style={{ backgroundColor: 'rgba(0, 181, 173, 0.1)' }}
                      >
                        <Video className="h-5 w-5" style={{ color: '#00B5AD' }} />
                      </button>
                      <button 
                        className="p-2 rounded-xl transition-all duration-200 active:scale-95"
                        style={{ backgroundColor: 'rgba(0, 181, 173, 0.1)' }}
                      >
                        <MoreVertical className="h-5 w-5" style={{ color: '#00B5AD' }} />
                      </button>
                    </div>
                  </div>

                  {/* Messages - WhatsApp Style */}
                  <div 
                    className="flex-1 overflow-y-auto p-4 space-y-3"
                    style={{ 
                      backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(0, 181, 173, 0.03) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(111, 115, 210, 0.03) 0%, transparent 50%)'
                    }}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <div 
                          className="animate-spin rounded-full h-8 w-8 border-4 border-t-transparent"
                          style={{ borderColor: '#00B5AD' }}
                        ></div>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                          <MessageCircle className="h-12 w-12 mx-auto mb-2" style={{ color: '#6F73D2', opacity: 0.5 }} />
                          <p style={{ color: '#6F73D2' }}>No messages yet</p>
                        </div>
                      </div>
                    ) : (
                      messages.map((message) => {
                        const isOwn = message.senderId === user?.id;
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
                              {!isOwn && (
                                <div className="flex items-center space-x-2 mb-1 px-2">
                                  <span className="text-xs font-semibold" style={{ color: '#0B1E3F' }}>
                                    {message.sender.username}
                                  </span>
                                </div>
                              )}
                              <div
                                className={`p-3 rounded-2xl ${
                                  isOwn ? 'rounded-tr-sm' : 'rounded-tl-sm'
                                }`}
                                style={{
                                  backgroundColor: isOwn ? '#00B5AD' : 'white',
                                  color: isOwn ? 'white' : '#0B1E3F',
                                  boxShadow: '0 2px 8px rgba(11, 30, 63, 0.1)'
                                }}
                              >
                                {message.attachments && message.attachments.length > 0 && (
                                  <div className="mb-2 space-y-2">
                                    {message.attachments.map((att, idx) => (
                                      <div key={idx} className="flex items-center space-x-2">
                                        {att.mimeType.startsWith('image/') ? (
                                          <img
                                            src={att.url}
                                            alt={att.filename}
                                            className="max-w-full h-auto rounded"
                                          />
                                        ) : (
                                          <a
                                            href={att.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center space-x-2 text-blue-400 hover:text-blue-300"
                                          >
                                            <File className="h-4 w-4" />
                                            <span className="text-sm">{att.filename}</span>
                                          </a>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                {message.reactions && message.reactions.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {message.reactions.map((reaction, idx) => (
                                      <button
                                        key={idx}
                                        onClick={() => {
                                          const hasReacted = reaction.userId === user?.id;
                                          if (hasReacted) {
                                            handleRemoveReaction(message.id, reaction.emoji);
                                          } else {
                                            handleAddReaction(message.id, reaction.emoji);
                                          }
                                        }}
                                        className={`px-2 py-1 text-xs ${
                                          reaction.userId === user?.id
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                                        }`}
                                      >
                                        {reaction.emoji} {reaction.user.username}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center justify-between mt-1 px-1">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatTime(message.createdAt)}
                                </span>
                                {isOwn && (
                                  <div className="flex items-center space-x-1">
                                    {message.readBy && message.readBy.length > 0 ? (
                                      <CheckCheck className="h-3 w-3 text-blue-500" />
                                    ) : (
                                      <CheckCheck className="h-3 w-3 text-gray-400" />
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    {typingUsers.size > 0 && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 dark:bg-gray-700 p-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Typing...</span>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input - Sticky */}
                  <div 
                    className="p-4 border-t backdrop-blur-xl"
                    style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      borderColor: '#E5E7EB'
                    }}
                  >
                    {attachments.length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-2">
                        {attachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
                          >
                            {attachment.preview ? (
                              <img
                                src={attachment.preview}
                                alt={attachment.name}
                                className="w-8 h-8 object-cover"
                              />
                            ) : (
                              <File className="h-4 w-4 text-gray-500" />
                            )}
                            <span className="text-xs text-gray-700 dark:text-gray-300 truncate max-w-[100px]">
                              {attachment.name}
                            </span>
                            <button
                              onClick={() => removeAttachment(attachment.id)}
                              className="text-gray-400 hover:text-red-500"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <button
                        ref={attachmentButtonRef}
                        onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                        className="p-3 rounded-xl transition-all duration-200 active:scale-95"
                        style={{ backgroundColor: 'rgba(0, 181, 173, 0.1)' }}
                      >
                        <Paperclip className="h-5 w-5" style={{ color: '#00B5AD' }} />
                      </button>
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-200"
                        style={{
                          borderColor: '#E5E7EB',
                          backgroundColor: 'white',
                          color: '#0B1E3F',
                          fontSize: '16px'
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#00B5AD';
                          e.currentTarget.style.boxShadow = '0 0 0 4px rgba(0, 181, 173, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#E5E7EB';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                      <button
                        onClick={() => handleSendMessage(newMessage)}
                        disabled={(!newMessage.trim() && attachments.length === 0) || isSending}
                        className="p-3 rounded-xl text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                        style={{ 
                          backgroundColor: '#00B5AD',
                          boxShadow: '0 4px 14px rgba(0, 181, 173, 0.3)'
                        }}
                      >
                        {isSending ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        ) : (
                          <Send className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="h-16 w-16 mx-auto mb-4" style={{ color: '#6F73D2', opacity: 0.5 }} />
                    <h3 className="text-lg font-bold mb-2" style={{ color: '#0B1E3F' }}>
                      Select a conversation
                    </h3>
                    <p style={{ color: '#6F73D2' }}>
                      Choose a conversation from the list to view messages
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile: Conversation List Overlay */}
      {!selectedConversation && (
        <div className="lg:hidden flex-1 overflow-y-auto" style={{ backgroundColor: 'white' }}>
          <div className="p-4 border-b" style={{ borderColor: '#E5E7EB' }}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5" style={{ color: '#6F73D2' }} />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-200"
                style={{
                  borderColor: '#E5E7EB',
                  backgroundColor: 'white',
                  color: '#0B1E3F',
                  fontSize: '16px'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#00B5AD';
                  e.currentTarget.style.boxShadow = '0 0 0 4px rgba(0, 181, 173, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>
          <div className="overflow-y-auto">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => {
                  setSelectedConversation(conversation);
                  markConversationAsRead(conversation.id);
                }}
                className="p-4 border-b transition-all duration-200 active:scale-[0.98]"
                style={{ 
                  backgroundColor: 'white',
                  borderColor: '#E5E7EB'
                }}
              >
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold flex-shrink-0"
                    style={{ 
                      background: 'linear-gradient(135deg, #00B5AD 0%, #6F73D2 100%)'
                    }}
                  >
                    {getConversationAvatar(conversation) ? (
                      <img
                        src={getConversationAvatar(conversation)}
                        alt={getConversationName(conversation)}
                        className="w-full h-full rounded-2xl object-cover"
                      />
                    ) : (
                      <span>{getConversationName(conversation).charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-bold truncate" style={{ color: '#0B1E3F' }}>
                        {getConversationName(conversation)}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <span 
                          className="ml-2 px-2 py-1 rounded-full text-xs font-bold text-white"
                          style={{ backgroundColor: '#00B5AD' }}
                        >
                          {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                        </span>
                      )}
                    </div>
                    {conversation.lastMessage && (
                      <p className="text-xs truncate" style={{ color: '#6F73D2' }}>
                        {conversation.lastMessage.content}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mobile: Message View */}
      {selectedConversation && (
        <div className="lg:hidden flex-1 flex flex-col" style={{ backgroundColor: '#F4F7FA' }}>
          {/* Mobile Chat Header */}
          <div 
            className="flex items-center justify-between p-4 border-b backdrop-blur-xl"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderColor: '#E5E7EB'
            }}
          >
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSelectedConversation(null)}
                className="p-2 rounded-xl transition-all duration-200 active:scale-95"
                style={{ backgroundColor: 'rgba(0, 181, 173, 0.1)' }}
              >
                <ArrowLeft className="h-5 w-5" style={{ color: '#00B5AD' }} />
              </button>
              <div 
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold"
                style={{ 
                  background: 'linear-gradient(135deg, #00B5AD 0%, #6F73D2 100%)'
                }}
              >
                {getConversationAvatar(selectedConversation) ? (
                  <img
                    src={getConversationAvatar(selectedConversation)}
                    alt={getConversationName(selectedConversation)}
                    className="w-full h-full rounded-2xl object-cover"
                  />
                ) : (
                  <span>{getConversationName(selectedConversation).charAt(0)}</span>
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold" style={{ color: '#0B1E3F' }}>
                  {getConversationName(selectedConversation)}
                </h3>
              </div>
            </div>
          </div>

          {/* Mobile Messages */}
          <div 
            className="flex-1 overflow-y-auto p-4 space-y-3"
            style={{ 
              backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(0, 181, 173, 0.03) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(111, 115, 210, 0.03) 0%, transparent 50%)'
            }}
          >
            {messages.map((message) => {
              const isOwn = message.senderId === user?.id;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[75%] ${isOwn ? 'order-2' : 'order-1'}`}>
                    {!isOwn && (
                      <div className="flex items-center space-x-2 mb-1 px-2">
                        <span className="text-xs font-semibold" style={{ color: '#0B1E3F' }}>
                          {message.sender.username}
                        </span>
                      </div>
                    )}
                    <div
                      className={`p-3 rounded-2xl ${
                        isOwn ? 'rounded-tr-sm' : 'rounded-tl-sm'
                      }`}
                      style={{
                        backgroundColor: isOwn ? '#00B5AD' : 'white',
                        color: isOwn ? 'white' : '#0B1E3F',
                        boxShadow: '0 2px 8px rgba(11, 30, 63, 0.1)'
                      }}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                      <div className="flex items-center justify-end mt-2 space-x-2">
                        <span className="text-xs opacity-70">
                          {formatTime(message.createdAt)}
                        </span>
                        {isOwn && (
                          <CheckCheck 
                            className={`h-3 w-3 ${message.readBy && message.readBy.length > 0 ? 'text-blue-300' : 'opacity-50'}`} 
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Mobile Message Input */}
          <div 
            className="p-4 border-t backdrop-blur-xl safe-area-bottom"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderColor: '#E5E7EB'
            }}
          >
            <div className="flex items-center space-x-2">
              <button
                ref={attachmentButtonRef}
                onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                className="p-3 rounded-xl transition-all duration-200 active:scale-95"
                style={{ backgroundColor: 'rgba(0, 181, 173, 0.1)' }}
              >
                <Paperclip className="h-5 w-5" style={{ color: '#00B5AD' }} />
              </button>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1 px-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-200"
                style={{
                  borderColor: '#E5E7EB',
                  backgroundColor: 'white',
                  color: '#0B1E3F',
                  fontSize: '16px'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#00B5AD';
                  e.currentTarget.style.boxShadow = '0 0 0 4px rgba(0, 181, 173, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              <button
                onClick={() => handleSendMessage(newMessage)}
                disabled={(!newMessage.trim() && attachments.length === 0) || isSending}
                className="p-3 rounded-xl text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                style={{ 
                  backgroundColor: '#00B5AD',
                  boxShadow: '0 4px 14px rgba(0, 181, 173, 0.3)'
                }}
              >
                {isSending ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAttachmentMenu && (
        <AttachmentMenu
          isOpen={showAttachmentMenu}
          onClose={() => setShowAttachmentMenu(false)}
          onAttachmentsSelected={handleAttachmentsSelected}
          buttonRef={attachmentButtonRef}
        />
      )}
    </div>
  );
};
