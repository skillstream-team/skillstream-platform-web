// src/pages/MessagesFirebase.tsx
// Firebase-based messaging page with real-time updates
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Link } from "react-router-dom"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { 
  MessageSquare,
  Search,
  Send,
  Plus
} from "lucide-react"
import { useEffect, useState, useRef, useCallback } from "react"
import { FirebaseMessagingAPI, Conversation, Message as MessageType } from "@/api/firebase-messaging.api"
import { getCurrentUser } from "@/api/auth-utils"
import { toast } from "sonner"
import { UsersAPI } from "@/api/users.api"
import { User } from "@/api/types"

export function MessagesFirebase() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<MessageType[]>([])
  const [messageText, setMessageText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [newConversationDialogOpen, setNewConversationDialogOpen] = useState(false)
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [searchingUsers, setSearchingUsers] = useState(false)
  const [creatingConversation, setCreatingConversation] = useState(false)
  const currentUser = getCurrentUser()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const unsubscribeConversationsRef = useRef<(() => void) | null>(null)
  const unsubscribeMessagesRef = useRef<(() => void) | null>(null)

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Subscribe to conversations (real-time)
  useEffect(() => {
    if (!currentUser?.id) return

    // Cleanup previous subscription
    if (unsubscribeConversationsRef.current) {
      unsubscribeConversationsRef.current()
    }

    // Subscribe to real-time conversation updates
    unsubscribeConversationsRef.current = FirebaseMessagingAPI.subscribeToConversations((updatedConversations) => {
      setConversations(updatedConversations)
      setLoading(false)

      // Update selected conversation if it exists
      if (selectedConversation) {
        const updated = updatedConversations.find(c => c.id === selectedConversation.id)
        if (updated) {
          setSelectedConversation(updated)
        }
      }
    })

    return () => {
      if (unsubscribeConversationsRef.current) {
        unsubscribeConversationsRef.current()
      }
    }
  }, [currentUser?.id])

  // Subscribe to messages when conversation is selected (real-time)
  useEffect(() => {
    if (!selectedConversation?.id) {
      setMessages([])
      return
    }

    // Cleanup previous subscription
    if (unsubscribeMessagesRef.current) {
      unsubscribeMessagesRef.current()
    }

    // Subscribe to real-time message updates
    unsubscribeMessagesRef.current = FirebaseMessagingAPI.getMessages(selectedConversation.id, (updatedMessages) => {
      setMessages(updatedMessages)
      setTimeout(() => scrollToBottom(), 100)
    })

    return () => {
      if (unsubscribeMessagesRef.current) {
        unsubscribeMessagesRef.current()
      }
    }
  }, [selectedConversation?.id])

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation?.id) {
      if (!messageText.trim()) {
        toast.error('Please enter a message')
      } else {
        toast.error('Please select a conversation')
      }
      return
    }

    if (!currentUser?.id) {
      toast.error('You must be logged in to send messages')
      return
    }

    try {
      setSending(true)
      
      await FirebaseMessagingAPI.sendMessage({
        conversationId: selectedConversation.id,
        content: messageText.trim(),
        type: 'text'
      })
      
      setMessageText('')
      setTimeout(() => scrollToBottom(), 100)
      toast.success('Message sent')
    } catch (error: any) {
      console.error('Failed to send message:', error)
      toast.error(error?.message || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  // Handle starting a new conversation
  const handleStartConversation = async (user: User) => {
    if (!currentUser?.id) {
      toast.error('You must be logged in to start a conversation')
      return
    }

    if (user.id === currentUser.id) {
      toast.error('You cannot start a conversation with yourself')
      return
    }

    if (creatingConversation) {
      return
    }

    try {
      setCreatingConversation(true)
      
      const conversation = await FirebaseMessagingAPI.getOrCreateConversation([currentUser.id, user.id])
      
      setSelectedConversation(conversation)
      setNewConversationDialogOpen(false)
      setUserSearchTerm('')
      setSearchResults([])
      toast.success('Conversation started')
    } catch (error: any) {
      console.error('Failed to start conversation:', error)
      toast.error(error?.message || 'Failed to start conversation')
    } finally {
      setCreatingConversation(false)
    }
  }

  // Search for users
  const handleUserSearch = useCallback(async (term: string) => {
    if (!term.trim() || term.length < 2) {
      setSearchResults([])
      return
    }

    try {
      setSearchingUsers(true)
      const results = await UsersAPI.searchUsers(term)
      setSearchResults(results.filter(u => u.id !== currentUser?.id))
    } catch (error) {
      console.error('Error searching users:', error)
      toast.error('Failed to search users')
    } finally {
      setSearchingUsers(false)
    }
  }, [currentUser?.id])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (userSearchTerm) {
        handleUserSearch(userSearchTerm)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [userSearchTerm, handleUserSearch])

  // Get other participant for display
  const getOtherParticipant = (conversation: Conversation) => {
    if (!currentUser?.id || !conversation.participants) return null
    return conversation.participants.find(p => (p.userId || p.id) !== currentUser.id) || conversation.participants[0]
  }

  // Get user display name
  const getUserDisplayName = (user: User | any) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`
    }
    return user.username || user.email || 'Unknown User'
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-col h-screen">
          <div className="border-b">
            <div className="flex h-16 items-center px-4">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:flex">
                    <BreadcrumbLink asChild>
                      <Link to="/">Home</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:flex" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Messages</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Conversations Sidebar */}
            <div className="w-80 border-r flex flex-col">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Conversations</h2>
                  <Button
                    size="sm"
                    onClick={() => setNewConversationDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="p-4 space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No conversations yet</p>
                    <p className="text-sm mt-1">Start a new conversation to get started</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {conversations
                      .filter(conv => {
                        if (!searchTerm) return true
                        const other = getOtherParticipant(conv)
                        const name = other ? getUserDisplayName(other) : conv.name || ''
                        return name.toLowerCase().includes(searchTerm.toLowerCase())
                      })
                      .map((conversation) => {
                        const other = getOtherParticipant(conversation)
                        const isSelected = selectedConversation?.id === conversation.id

                        return (
                          <button
                            key={conversation.id}
                            onClick={() => setSelectedConversation(conversation)}
                            className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                              isSelected ? 'bg-muted' : ''
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={other?.avatar} />
                                <AvatarFallback>
                                  {getUserDisplayName(other || conversation)
                                    .split(' ')
                                    .map(n => n[0])
                                    .join('')
                                    .toUpperCase()
                                    .slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="font-medium text-sm truncate">
                                    {conversation.name || getUserDisplayName(other || conversation)}
                                  </p>
                                  {conversation.unreadCount > 0 && (
                                    <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">
                                      {conversation.unreadCount}
                                    </span>
                                  )}
                                </div>
                                {conversation.lastMessage && (
                                  <p className="text-xs text-muted-foreground truncate mt-1">
                                    {conversation.lastMessage.content}
                                  </p>
                                )}
                              </div>
                            </div>
                          </button>
                        )
                      })}
                  </div>
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  <div className="border-b p-4">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={getOtherParticipant(selectedConversation)?.avatar} />
                        <AvatarFallback>
                          {getUserDisplayName(getOtherParticipant(selectedConversation) || selectedConversation)
                            .split(' ')
                            .map(n => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {selectedConversation.name || getUserDisplayName(getOtherParticipant(selectedConversation) || selectedConversation)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {selectedConversation.type === 'direct' ? 'Direct message' : 'Group conversation'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => {
                      const isOwn = message.senderId === currentUser?.id
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                            {!isOwn && (
                              <p className="text-xs text-muted-foreground mb-1">
                                {message.sender?.username || 'Unknown'}
                              </p>
                            )}
                            <div
                              className={`rounded-lg p-3 ${
                                isOwn
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                              <p className={`text-xs mt-1 ${
                                isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                              }`}>
                                {new Date(message.createdAt).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="border-t p-4">
                    <div className="flex gap-2">
                      <Input
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleSendMessage()
                          }
                        }}
                        placeholder="Type a message..."
                        disabled={sending}
                        className="flex-1"
                      />
                      <Button onClick={handleSendMessage} disabled={!messageText.trim() || sending}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Select a conversation</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Choose a conversation from the list to start messaging
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* New Conversation Dialog */}
        <Dialog open={newConversationDialogOpen} onOpenChange={setNewConversationDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start New Conversation</DialogTitle>
              <DialogDescription>
                Search for a user to start a conversation with
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Search users..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
              />
              {searchingUsers && <p className="text-sm text-muted-foreground">Searching...</p>}
              {searchResults.length > 0 && (
                <div className="border rounded-lg max-h-60 overflow-y-auto">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleStartConversation(user)}
                      disabled={creatingConversation}
                      className="w-full p-3 text-left hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>
                            {getUserDisplayName(user)
                              .split(' ')
                              .map(n => n[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {getUserDisplayName(user)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  )
}

