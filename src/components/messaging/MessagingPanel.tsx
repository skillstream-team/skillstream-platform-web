import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, 
  Search, 
  Send, 
  MoreVertical, 
  Phone, 
  Video, 
  Paperclip, 
  Smile,
  X,
  CheckCheck,
  File,
  Plus
} from 'lucide-react';
import { 
  getConversations,
  createConversation,
  getMessages,
  sendMessage,
  markConversationAsRead,
  uploadMessageFile,
  addMessageReaction,
  removeMessageReaction
} from '../../services/api';
import { Conversation, Message } from '../../types';
import { useAuthStore } from '../../store/auth';
import { messagingSocketService } from '../../services/messagingSocket';
import { AttachmentMenu, Attachment } from './AttachmentMenu';
import { fileToBase64, formatFileSize } from '../../utils/fileUtils';

interface MessagingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUserId?: string;
}

export const MessagingPanel: React.FC<MessagingPanelProps> = ({
  isOpen,
  onClose,
  selectedUserId
}) => {
  const { user, token } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const attachmentButtonRef = useRef<HTMLButtonElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  // Initialize Socket.IO
  useEffect(() => {
    if (isOpen && user && token) {
      messagingSocketService.connect(token, user.id);

      const handleNewMessage = (message: Message) => {
        if (selectedConversation && message.conversationId === selectedConversation.id) {
          setMessages(prev => [...prev, message]);
          scrollToBottom();
        }
        loadConversations();
      };

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

      messagingSocketService.onMessage(handleNewMessage);
      messagingSocketService.onTyping(handleTyping);

      return () => {
        messagingSocketService.offMessage(handleNewMessage);
        messagingSocketService.offTyping(handleTyping);
      };
    }
  }, [isOpen, user, token, selectedConversation]);

  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen]);

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
    if (selectedUserId && conversations.length > 0) {
      const conv = conversations.find(c => 
        c.type === 'direct' && 
        c.participants.some(p => p.userId === selectedUserId)
      );
      if (conv) {
        setSelectedConversation(conv);
      }
    }
  }, [selectedUserId, conversations]);

  const loadConversations = async () => {
    try {
      const result = await getConversations({ limit: 50 });
      setConversations(result.data);
    } catch (error) {
      console.error('Error loading conversations:', error);
      setConversations([]);
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

  const handleSendMessage = async (content: string) => {
    if ((!content.trim() && attachments.length === 0) || !selectedConversation) return;

    try {
      setIsSending(true);

      // Upload attachments
      const uploadedAttachments = [];
      for (const attachment of attachments) {
        try {
          const base64 = await fileToBase64(attachment.file);
          const uploadResult = await uploadMessageFile({
            file: base64,
            filename: attachment.name,
            contentType: attachment.type || 'application/octet-stream',
            conversationId: selectedConversation.id
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

      // Send via REST API
      await sendMessage({
        conversationId: selectedConversation.id,
        content: content.trim(),
        type: uploadedAttachments.length > 0 ? 'file' : 'text',
        attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined
      });

      // Also send via Socket.IO
      messagingSocketService.sendMessage({
        conversationId: selectedConversation.id,
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

  const handleAddReaction = async (messageId: string, emoji: string) => {
    try {
      await addMessageReaction(messageId, emoji);
      messagingSocketService.addReaction(messageId, emoji);
    } catch (error) {
      console.error('Error adding reaction:', error);
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
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Messages</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Conversations List */}
          <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {conversations
                .filter(conv => {
                  if (!searchQuery) return true;
                  const searchLower = searchQuery.toLowerCase();
                  if (conv.name?.toLowerCase().includes(searchLower)) return true;
                  return conv.participants.some(p => 
                    p.user.username.toLowerCase().includes(searchLower) ||
                    p.user.email.toLowerCase().includes(searchLower)
                  );
                })
                .map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      selectedConversation?.id === conversation.id ? 'bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          {getConversationName(conversation).charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {getConversationName(conversation)}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs font-medium rounded-full">
                              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                            </span>
                          )}
                        </div>
                        {conversation.lastMessage && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {conversation.lastMessage.content}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Messages View */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Conversation Header */}
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
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500 dark:text-gray-400">No messages yet</p>
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
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-xs font-medium text-gray-900 dark:text-white">
                                  {message.sender.username}
                                </span>
                              </div>
                            )}
                            <div
                              className={`p-3 ${
                                isOwn
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                              }`}
                            >
                              {message.attachments && message.attachments.length > 0 && (
                                <div className="mb-2 space-y-2">
                                  {message.attachments.map((att, idx) => (
                                    <div key={idx}>
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
                                          removeMessageReaction(message.id, reaction.emoji);
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

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
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
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <Paperclip className="h-4 w-4" />
                    </button>
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    <button
                      onClick={() => handleSendMessage(newMessage)}
                      disabled={(!newMessage.trim() && attachments.length === 0) || isSending}
                      className="p-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSending ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Select a conversation
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Choose a conversation from the list to view messages
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAttachmentMenu && (
        <AttachmentMenu
          isOpen={showAttachmentMenu}
          onClose={() => setShowAttachmentMenu(false)}
          onSelect={handleAttachmentsSelected}
          buttonRef={attachmentButtonRef}
        />
      )}
    </div>
  );
};
