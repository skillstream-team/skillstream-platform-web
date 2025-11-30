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
import { AttachmentMenu, Attachment } from '../components/messaging/AttachmentMenu';
import { 
  getUsers, 
  getConversations, 
  createConversation,
  getMessages,
  sendMessage,
  markConversationAsRead,
  uploadMessageFile
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
    <div className="messages-page">
      {/* Header Section */}
      <div className="courses-header">
        <div className="courses-header-content">
          <div className="courses-header-text">
            <h1 className="courses-header-title">
              Messages
            </h1>
            <p className="courses-header-subtitle">
              Connect with instructors and fellow learners
            </p>
          </div>
          <button
            onClick={() => setIsNewMessageMode(true)}
            className="courses-create-button"
          >
            <Plus className="courses-create-button-icon" />
            New Conversation
          </button>
        </div>
      </div>

      <div className="messages-container">
        {isNewMessageMode ? (
          // New Message Interface
          <div className="messages-new-mode">
            {/* User Selection */}
            <div className="messages-user-selection">
              <div className="messages-user-selection-header">
                <h3 className="messages-user-selection-title">
                  Select Recipient
                </h3>
                <div className="messages-search-wrapper">
                  <Search className="messages-search-icon" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="messages-search-input"
                  />
                </div>
              </div>

              <div className="messages-user-list">
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
                    className={`messages-user-item ${selectedUserForNew?.id === userItem.id ? 'messages-user-item--selected' : ''}`}
                  >
                    <div className="messages-user-item-content">
                      <div className="messages-user-avatar">
                        <span className="messages-user-avatar-text">
                          {userItem.name.charAt(0)}
                        </span>
                      </div>
                      <div className="messages-user-info">
                        <p className="messages-user-name">
                          {userItem.name}
                        </p>
                        <p className="messages-user-email">
                          {userItem.email}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Message Composition */}
            <div className="messages-composition">
              {selectedConversation ? (
                <>
                  {/* Recipient Header */}
                  <div className="messages-recipient-header">
                    <div className="messages-recipient-info">
                      <div className="messages-recipient-avatar">
                        <span>
                          {getConversationName(selectedConversation).charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="messages-recipient-name">
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
                      className="messages-close-button"
                    >
                      <X className="messages-close-button-icon" />
                    </button>
                  </div>

                  {/* Message Input */}
                  <div className="messages-composition-area">
                    <div className="messages-textarea-wrapper">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your message here..."
                        className="messages-textarea"
                        rows={10}
                      />
                    </div>
                    
                    {attachments.length > 0 && (
                      <div className="messages-attachments-preview">
                        <div className="messages-attachments-list">
                          {attachments.map((attachment) => (
                            <div key={attachment.id} className="messages-attachment-item">
                              {attachment.preview ? (
                                <img
                                  src={attachment.preview}
                                  alt={attachment.name}
                                  className="messages-attachment-preview"
                                />
                              ) : (
                                <div className="messages-attachment-icon">
                                  <File />
                                </div>
                              )}
                              <div className="messages-attachment-info">
                                <p className="messages-attachment-name">
                                  {attachment.name}
                                </p>
                                <p className="messages-attachment-size">
                                  {formatFileSize(attachment.size)}
                                </p>
                              </div>
                              <button
                                onClick={() => removeAttachment(attachment.id)}
                                className="messages-attachment-remove"
                              >
                                <X className="messages-close-button-icon" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="messages-composition-actions">
                      <div className="messages-composition-left">
                        <button
                          ref={attachmentButtonRef}
                          onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                          className="messages-attachment-button"
                        >
                          <Paperclip className="messages-attachment-button-icon" />
                        </button>
                      </div>
                      <div className="messages-composition-right">
                        <button
                          onClick={() => {
                            setIsNewMessageMode(false);
                            setSelectedConversation(null);
                            setSelectedUserForNew(null);
                            setNewMessage('');
                          }}
                          className="messages-cancel-button"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSendMessage(newMessage)}
                          disabled={(!newMessage.trim() && attachments.length === 0) || isSending}
                          className="messages-send-button"
                        >
                          {isSending ? (
                            <div className="messages-send-spinner"></div>
                          ) : (
                            <Send className="messages-send-button-icon" />
                          )}
                          Send
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="messages-empty-state">
                  <div className="messages-empty-state-content">
                    <MessageCircle className="messages-empty-state-icon" />
                    <h3 className="messages-empty-state-title">
                      Select a recipient
                    </h3>
                    <p className="messages-empty-state-text">
                      Choose someone from the list to start a new conversation
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Regular Messages Interface - WhatsApp Style
          <div className="messages-regular-interface">
            {/* Conversations List */}
            <div className="messages-conversations-list">
              <div className="messages-conversations-search">
                <div className="messages-conversations-search-wrapper">
                  <Search className="messages-conversations-search-icon" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="messages-conversations-search-input"
                  />
                </div>
              </div>

              <div className="messages-conversations-scroll">
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
                        className={`messages-conversation-item ${isSelected ? 'messages-conversation-item--selected' : ''}`}
                      >
                        <div className="messages-conversation-content">
                          <div className="messages-conversation-avatar">
                            {getConversationAvatar(conversation) ? (
                              <img
                                src={getConversationAvatar(conversation)}
                                alt={getConversationName(conversation)}
                              />
                            ) : (
                              <span>{getConversationName(conversation).charAt(0)}</span>
                            )}
                          </div>
                          <div className="messages-conversation-info">
                            <div className="messages-conversation-header">
                              <p className="messages-conversation-name">
                                {getConversationName(conversation)}
                              </p>
                              {conversation.unreadCount > 0 && (
                                <span className="messages-conversation-unread">
                                  {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                                </span>
                              )}
                            </div>
                            {conversation.lastMessage && (
                              <p className="messages-conversation-preview">
                                {conversation.lastMessage.content}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="messages-conversations-empty">
                    <div className="messages-conversations-empty-content">
                      <MessageCircle className="messages-conversations-empty-icon" />
                      <p className="messages-conversations-empty-title">No conversations yet</p>
                      <p className="messages-conversations-empty-text">Start a new conversation to get started</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Messages View */}
            <div className="messages-view">
              {selectedConversation ? (
                <>
                  {/* Conversation Header - Sticky */}
                  <div className="messages-conversation-header-bar">
                    <div className="messages-conversation-header-left">
                      <div className="messages-conversation-header-avatar">
                        {getConversationAvatar(selectedConversation) ? (
                          <img
                            src={getConversationAvatar(selectedConversation)}
                            alt={getConversationName(selectedConversation)}
                          />
                        ) : (
                          <span>{getConversationName(selectedConversation).charAt(0)}</span>
                        )}
                      </div>
                      <div className="messages-conversation-header-info">
                        <h3 className="messages-conversation-header-name">
                          {getConversationName(selectedConversation)}
                        </h3>
                        {selectedConversation.type === 'group' && (
                          <p className="messages-conversation-header-meta">
                            {selectedConversation.participants.length} participants
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="messages-conversation-header-actions">
                      <button className="messages-header-action-button">
                        <Phone className="messages-header-action-icon" />
                      </button>
                      <button className="messages-header-action-button">
                        <Video className="messages-header-action-icon" />
                      </button>
                      <button className="messages-header-action-button">
                        <MoreVertical className="messages-header-action-icon" />
                      </button>
                    </div>
                  </div>

                  {/* Messages - WhatsApp Style */}
                  <div className="messages-list-container">
                    {isLoading ? (
                      <div className="messages-empty-state">
                        <div className="messages-loading-spinner"></div>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="messages-empty-state">
                        <div className="messages-empty-state-content">
                          <MessageCircle className="messages-empty-state-icon" />
                          <p className="messages-empty-state-text">No messages yet</p>
                        </div>
                      </div>
                    ) : (
                      messages.map((message) => {
                        const isOwn = message.senderId === user?.id;
                        return (
                          <div
                            key={message.id}
                            className={`messages-message-wrapper ${isOwn ? 'messages-message-wrapper--sent' : 'messages-message-wrapper--received'}`}
                          >
                            <div className={`messages-message ${isOwn ? 'messages-message--sent' : 'messages-message--received'}`}>
                              {message.attachments && message.attachments.length > 0 && (
                                <div className="messages-message-attachment">
                                  {message.attachments.map((att, idx) => (
                                    <div key={idx}>
                                      {att.mimeType.startsWith('image/') ? (
                                        <img
                                          src={att.url}
                                          alt={att.filename}
                                          className="messages-message-attachment-image"
                                        />
                                      ) : (
                                        <a
                                          href={att.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="messages-message-attachment-file"
                                        >
                                          <File className="messages-message-attachment-file-icon" />
                                          <div className="messages-message-attachment-file-info">
                                            <span className="messages-message-attachment-file-name">{att.filename}</span>
                                          </div>
                                        </a>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                              <p className="messages-message-content">{message.content}</p>
                              <div className="messages-message-meta">
                                <span className="messages-message-time">{formatTime(message.createdAt)}</span>
                                {isOwn && (
                                  <CheckCheck className={`messages-message-status ${message.readBy && message.readBy.length > 0 ? 'messages-message-status--read' : 'messages-message-status--sent'}`} />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    {typingUsers.size > 0 && (
                      <div className="messages-typing-indicator">
                        <span>Typing</span>
                        <div className="messages-typing-dots">
                          <div className="messages-typing-dot"></div>
                          <div className="messages-typing-dot"></div>
                          <div className="messages-typing-dot"></div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input - Sticky */}
                  <div className="messages-input-container">
                    {attachments.length > 0 && (
                      <div className="messages-attachments-preview">
                        <div className="messages-attachments-list">
                          {attachments.map((attachment) => (
                            <div key={attachment.id} className="messages-attachment-item">
                              {attachment.preview ? (
                                <img
                                  src={attachment.preview}
                                  alt={attachment.name}
                                  className="messages-attachment-preview"
                                />
                              ) : (
                                <div className="messages-attachment-icon">
                                  <File />
                                </div>
                              )}
                              <div className="messages-attachment-info">
                                <p className="messages-attachment-name">{attachment.name}</p>
                              </div>
                              <button
                                onClick={() => removeAttachment(attachment.id)}
                                className="messages-attachment-remove"
                              >
                                <X className="messages-close-button-icon" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="messages-input-wrapper">
                      <button
                        ref={attachmentButtonRef}
                        onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                        className="messages-input-attachment-button"
                      >
                        <Paperclip className="messages-input-attachment-button-icon" />
                      </button>
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message..."
                        className="messages-input-field"
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
              ) : null}
            </div>
          </div>
        )}
      </div>

      {/* Mobile: Conversation List Overlay */}
      {!selectedConversation && (
        <div className="messages-mobile-conversations">
          <div className="messages-mobile-conversations-search">
            <div className="messages-mobile-conversations-search-wrapper">
              <Search className="messages-mobile-conversations-search-icon" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="messages-mobile-conversations-search-input"
              />
            </div>
          </div>
          <div className="messages-mobile-conversations-scroll">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => {
                  setSelectedConversation(conversation);
                  markConversationAsRead(conversation.id);
                }}
                className="messages-mobile-conversation-item"
              >
                <div className="messages-conversation-content">
                  <div className="messages-conversation-avatar">
                    {getConversationAvatar(conversation) ? (
                      <img
                        src={getConversationAvatar(conversation)}
                        alt={getConversationName(conversation)}
                      />
                    ) : (
                      <span>{getConversationName(conversation).charAt(0)}</span>
                    )}
                  </div>
                  <div className="messages-conversation-info">
                    <div className="messages-conversation-header">
                      <p className="messages-conversation-name">
                        {getConversationName(conversation)}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <span className="messages-conversation-unread">
                          {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                        </span>
                      )}
                    </div>
                    {conversation.lastMessage && (
                      <p className="messages-conversation-preview">
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
        <div className="messages-mobile-view">
          {/* Mobile Chat Header */}
          <div className="messages-mobile-chat-header">
            <div className="messages-mobile-chat-header-left">
              <button
                onClick={() => setSelectedConversation(null)}
                className="messages-mobile-back-button"
              >
                <ArrowLeft className="messages-mobile-back-button-icon" />
              </button>
              <div className="messages-mobile-chat-avatar">
                {getConversationAvatar(selectedConversation) ? (
                  <img
                    src={getConversationAvatar(selectedConversation)}
                    alt={getConversationName(selectedConversation)}
                  />
                ) : (
                  <span>{getConversationName(selectedConversation).charAt(0)}</span>
                )}
              </div>
              <div>
                <h3 className="messages-mobile-chat-name">
                  {getConversationName(selectedConversation)}
                </h3>
              </div>
            </div>
          </div>

          {/* Mobile Messages */}
          <div className="messages-list-container">
            {messages.map((message) => {
              const isOwn = message.senderId === user?.id;
              return (
                <div
                  key={message.id}
                  className={`messages-message-wrapper ${isOwn ? 'messages-message-wrapper--sent' : 'messages-message-wrapper--received'}`}
                >
                  <div className={`messages-message ${isOwn ? 'messages-message--sent' : 'messages-message--received'}`}>
                    <p className="messages-message-content">{message.content}</p>
                    <div className="messages-message-meta">
                      <span className="messages-message-time">{formatTime(message.createdAt)}</span>
                      {isOwn && (
                        <CheckCheck className={`messages-message-status ${message.readBy && message.readBy.length > 0 ? 'messages-message-status--read' : 'messages-message-status--sent'}`} />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Mobile Message Input */}
          <div className="messages-input-container">
            <div className="messages-input-wrapper">
              <button
                ref={attachmentButtonRef}
                onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                className="messages-input-attachment-button"
              >
                <Paperclip className="messages-input-attachment-button-icon" />
              </button>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="messages-input-field"
              />
              <button
                onClick={() => handleSendMessage(newMessage)}
                disabled={(!newMessage.trim() && attachments.length === 0) || isSending}
                className="messages-input-send-button"
              >
                {isSending ? (
                  <div className="messages-input-send-spinner"></div>
                ) : (
                  <Send className="messages-input-send-button-icon" />
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
