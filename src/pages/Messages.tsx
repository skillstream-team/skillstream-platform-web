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
  CardDescription,
  CardHeader,
  CardTitle,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
  Paperclip,
  MoreVertical,
  Trash2,
  Plus
} from "lucide-react"
import { useEffect, useState, useRef, useCallback } from "react"
import { MessagingAPI, Conversation, Message as MessageType } from "@/api/messaging.api"
import { getCurrentUser } from "@/api/auth-utils"
import { toast } from "sonner"
import { UsersAPI } from "@/api/users.api"
import { User } from "@/api/types"
import { useSocket } from "@/hooks/useSocket"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Messages() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<MessageType[]>([])
  const [messageText, setMessageText] = useState('')
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null)
  const [newConversationDialogOpen, setNewConversationDialogOpen] = useState(false)
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [searchingUsers, setSearchingUsers] = useState(false)
  const [creatingConversation, setCreatingConversation] = useState(false)
  const currentUser = getCurrentUser()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const hasFetched = useRef(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const prevConversationIdRef = useRef<string | null>(null)
  const { socket, isConnected, joinConversation, leaveConversation, on, off } = useSocket()

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true)
      const response = await MessagingAPI.getConversations()
      setConversations(response.conversations || [])
      // Select first conversation if available
      if (response.conversations && response.conversations.length > 0 && !selectedConversation) {
        setSelectedConversation(response.conversations[0])
      }
    } catch (error: any) {
      console.error('Failed to fetch conversations:', error)
      if (error?.response?.status === 401) {
        console.warn('Unauthorized - using empty data for development')
      }
      setConversations([])
    } finally {
      setLoading(false)
    }
  }, [selectedConversation])

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true

    fetchConversations()
  }, [fetchConversations])

  // Set up Socket.IO listeners for real-time messages
  useEffect(() => {
    if (!isConnected) return

    const handleNewMessage = (socketData: any) => {
      // Socket.IO sends: { type: 'message', data: message } or { message, conversationId }
      // Handle both formats
      let message: MessageType
      let conversationId: string
      
      if (socketData.data && socketData.type === 'message') {
        // Format from Socket.IO: { type: 'message', data: message }
        message = socketData.data
        conversationId = message.conversationId
      } else if (socketData.message) {
        // Format: { message, conversationId }
        message = socketData.message
        conversationId = socketData.conversationId || message.conversationId
      } else {
        // Assume it's the message itself
        message = socketData
        conversationId = message.conversationId
      }
      
      // Only add message if it's for the current conversation
      if (conversationId === selectedConversation?.id) {
        setMessages((prev) => {
          // Check if message already exists (avoid duplicates)
          const exists = prev.some((m) => m.id === message.id)
          if (exists) return prev
          return [...prev, message]
        })
        // Scroll to bottom when new message arrives
        setTimeout(() => scrollToBottom(), 100)
      }
      
      // Refresh conversations list to update last message and unread count
      fetchConversations()
    }

    const handleMessageUpdated = (data: { message: MessageType }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === data.message.id ? data.message : m))
      )
    }

    const handleConversationUpdated = (data: { conversation: Conversation }) => {
      setConversations((prev) =>
        prev.map((c) => (c.id === data.conversation.id ? data.conversation : c))
      )
    }

    // Register listeners
    on('new_message', handleNewMessage)
    on('message_updated', handleMessageUpdated)
    on('conversation_updated', handleConversationUpdated)

    // Cleanup
    return () => {
      off('new_message', handleNewMessage)
      off('message_updated', handleMessageUpdated)
      off('conversation_updated', handleConversationUpdated)
    }
  }, [isConnected, selectedConversation?.id, on, off, fetchConversations])

  // Join/leave conversation rooms when selection changes
  useEffect(() => {
    if (!isConnected) return

    // Leave previous conversation
    if (prevConversationIdRef.current && prevConversationIdRef.current !== selectedConversation?.id) {
      leaveConversation(prevConversationIdRef.current)
    }

    // Join new conversation
    if (selectedConversation?.id) {
      joinConversation(selectedConversation.id)
      prevConversationIdRef.current = selectedConversation.id
    }

    return () => {
      if (selectedConversation?.id) {
        leaveConversation(selectedConversation.id)
      }
    }
  }, [selectedConversation?.id, isConnected, joinConversation, leaveConversation])

  useEffect(() => {
    if (selectedConversation?.id) {
      // Fetch messages and mark as read in parallel
      Promise.all([
        fetchMessages(selectedConversation.id),
        markAsRead(selectedConversation.id)
      ]).catch(err => console.error('Error loading conversation:', err))
    }
  }, [selectedConversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchMessages = async (conversationId: string) => {
    if (!conversationId || conversationId === 'undefined') {
      console.error('Invalid conversation ID provided to fetchMessages:', conversationId)
      return
    }
    
    try {
      setMessagesLoading(true)
      console.log('Fetching messages for conversation:', conversationId)
      const response = await MessagingAPI.getMessages(conversationId)
      setMessages(response.messages || [])
    } catch (error: any) {
      console.error('Failed to fetch messages:', error)
      if (error?.response?.status === 401) {
        console.warn('Unauthorized - using empty data for development')
      }
      setMessages([])
    } finally {
      setMessagesLoading(false)
    }
  }

  const markAsRead = async (conversationId: string) => {
    if (!conversationId || conversationId === 'undefined') {
      console.error('Invalid conversation ID provided to markAsRead:', conversationId)
      return
    }
    
    try {
      console.log('Marking messages as read for conversation:', conversationId)
      await MessagingAPI.markAsRead(conversationId)
      // Refresh conversations to update unread count
      fetchConversations()
    } catch (error: any) {
      console.error('Failed to mark as read:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation?.id) {
      if (!messageText.trim()) {
        toast.error('Please enter a message')
      } else {
        toast.error('Please select a conversation')
      }
      return
    }

    const conversationId = selectedConversation.id.trim()
    if (!conversationId || conversationId === 'undefined' || conversationId === 'null') {
      toast.error('Invalid conversation. Please select a valid conversation.')
      return
    }

    if (!currentUser?.id) {
      toast.error('You must be logged in to send messages')
      return
    }

    try {
      setSending(true)
      
      // Get recipient for receiverId (optional but helpful for backend)
      const recipient = getOtherParticipant(selectedConversation)
      const receiverId = recipient ? (recipient.userId || recipient.id || (recipient as any).user?.id) : undefined

      // Send message - backend will handle participant validation
      const sentMessage = await MessagingAPI.sendMessage({
        conversationId: conversationId,
        receiverId: receiverId ? String(receiverId).trim() : undefined,
        content: messageText.trim(),
        type: 'text'
      })
      
      // Clear input immediately for better UX
      setMessageText('')
      
      // Optimistically add message to UI (don't wait for refresh)
      if (sentMessage) {
        setMessages((prev) => {
          // Check if message already exists (avoid duplicates)
          const exists = prev.some((m) => m.id === sentMessage.id)
          if (exists) return prev
          return [...prev, sentMessage]
        })
        // Scroll to bottom
        setTimeout(() => scrollToBottom(), 100)
      }
      
      // Refresh conversations list in background to update last message
      fetchConversations().catch(err => console.error('Error refreshing conversations:', err))
      
      toast.success('Message sent')
    } catch (error: any) {
      console.error('Failed to send message:', error)
      
      const errorMessage = error?.response?.data?.error || 
                          error?.response?.data?.message || 
                          error?.message || 
                          'Failed to send message. Please try again.'
      
      toast.error(errorMessage)
      
      // If it's a participant error, refresh the conversation
      if (errorMessage.includes('participant') || error?.response?.status === 403) {
        try {
          const refreshedConv = await MessagingAPI.getConversation(conversationId)
          if (refreshedConv) {
            setSelectedConversation({
              ...refreshedConv,
              id: conversationId
            })
          }
        } catch (refreshError) {
          console.error('Failed to refresh conversation:', refreshError)
        }
      }
    } finally {
      setSending(false)
    }
  }

  const handleDeleteClick = (conversationId: string) => {
    setConversationToDelete(conversationId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConversation = async () => {
    if (!conversationToDelete) return

    try {
      await MessagingAPI.deleteConversation(conversationToDelete)
      if (selectedConversation?.id === conversationToDelete) {
        setSelectedConversation(null)
        setMessages([])
      }
      setDeleteDialogOpen(false)
      setConversationToDelete(null)
      fetchConversations()
      toast.success('Conversation deleted successfully')
    } catch (error: any) {
      console.error('Failed to delete conversation:', error)
      toast.error('Failed to delete conversation. Please try again.')
    }
  }

  const getOtherParticipant = (conversation: Conversation) => {
    if (!conversation.participants || !currentUser) return null
    // Check both id and userId fields (backend uses userId in participants)
    return conversation.participants.find((p: any) => {
      const participantUserId = p.userId || p.user?.id || p.id
      return participantUserId !== currentUser.id
    })
  }

  const getParticipantName = (conversation: Conversation) => {
    const participant = getOtherParticipant(conversation)
    if (!participant) return 'Unknown'
    return participant.firstName && participant.lastName
      ? `${participant.firstName} ${participant.lastName}`
      : participant.username || participant.email || 'Unknown'
  }

  const getParticipantAvatar = (conversation: Conversation) => {
    const participant = getOtherParticipant(conversation)
    return participant?.avatar
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

    if (messageDate.getTime() === today.getTime()) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const filteredConversations = conversations.filter((conv) => {
    if (searchTerm) {
      const name = getParticipantName(conv).toLowerCase()
      return name.includes(searchTerm.toLowerCase())
    }
    return true
  })

  const isMyMessage = (message: MessageType) => {
    return message.senderId === currentUser?.id
  }

  const searchUsers = useCallback(async (search: string) => {
    if (!search.trim() || search.length < 2) {
      setSearchResults([])
      return
    }

    try {
      setSearchingUsers(true)
      const response = await UsersAPI.searchUsers({
        q: search.trim(),
        limit: 10
      })
      // Filter out current user
      const filtered = (response.data || []).filter((user: any) => user.id !== currentUser?.id)
      setSearchResults(filtered)
    } catch (error: any) {
      console.error('Failed to search users:', error?.response?.data?.error || error?.message)
      if (error?.response?.status === 500) {
        toast.error('Server error: The search endpoint may not be implemented yet. Please contact support.')
      } else if (error?.response?.status === 404) {
        toast.error('Search endpoint not found. Please contact support.')
      } else {
        toast.error(error?.response?.data?.message || 'Failed to search users. Please try again.')
      }
      setSearchResults([])
    } finally {
      setSearchingUsers(false)
    }
  }, [currentUser?.id])

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (userSearchTerm.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        searchUsers(userSearchTerm)
      }, 300)
    } else {
      setSearchResults([])
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [userSearchTerm, searchUsers])

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
      return // Prevent multiple clicks
    }

    try {
      setCreatingConversation(true)
      
      // Ensure currentUser.id is valid
      if (!currentUser?.id) {
        throw new Error('Current user ID is missing')
      }
      
      // Create conversation - ensure current user is first in the array
      // Backend should add all participants from participantIds array
      const participantIds = [currentUser.id, user.id]
      
      const conversation = await MessagingAPI.getOrCreateConversation(participantIds)
      
      // Handle different response structures
      let conversationId = conversation?.id
      if (!conversationId && conversation) {
        conversationId = (conversation as any)._id || (conversation as any).conversationId || (conversation as any).conversation?.id
      }
      
      if (!conversation || !conversationId) {
        throw new Error('Invalid conversation response: No conversation ID found')
      }
      
      // Ensure conversation has id property
      const conversationWithId = {
        ...conversation,
        id: conversationId
      }

      // Always fetch the full conversation to ensure we have the latest state
      // This ensures the backend has fully saved the participants
      let fullConversation = conversationWithId
      try {
        const fetchedConv = await MessagingAPI.getConversation(conversationId)
        if (fetchedConv) {
          fullConversation = {
            ...fetchedConv,
            id: conversationId
          }
          console.log('Fetched full conversation:', fullConversation)
          console.log('Fetched participants:', fullConversation.participants)
        }
      } catch (fetchError) {
        console.error('Failed to fetch full conversation:', fetchError)
        // Continue with the conversation we have
      }
      
      // Check if current user is in participants (check both id and userId fields)
      const hasCurrentUser = fullConversation.participants?.some((p: any) => {
        const participantUserId = p.userId || p.user?.id || p.id
        const currentUserId = currentUser.id
        console.log('Checking participant:', {
          participantUserId,
          currentUserId,
          match: participantUserId === currentUserId,
          participant: p
        })
        return participantUserId === currentUserId
      })
      
      console.log('Current user ID:', currentUser.id)
      console.log('Has current user in participants:', hasCurrentUser)
      console.log('All participant IDs:', fullConversation.participants?.map((p: any) => p.userId || p.user?.id || p.id))
      
      // If current user is not in participants, add them explicitly
      if (!hasCurrentUser && conversationId) {
        console.log('Current user not found in participants, adding them...')
        try {
          await MessagingAPI.addParticipants(conversationId, [currentUser.id])
          console.log('Successfully added current user as participant')
          
          // Fetch again to get updated participants
          const updatedConv = await MessagingAPI.getConversation(conversationId)
          if (updatedConv) {
            fullConversation = {
              ...updatedConv,
              id: conversationId
            }
          }
        } catch (addError: any) {
          console.error('Failed to add current user as participant:', addError)
          console.error('Error details:', {
            status: addError?.response?.status,
            data: addError?.response?.data,
            message: addError?.message
          })
        }
      }

      // Ensure participants are populated - use fetched conversation if available
      if (!fullConversation.participants || fullConversation.participants.length === 0) {
        // Fallback: manually populate participants if fetch failed
        fullConversation = {
          ...fullConversation,
          participants: [
            {
              id: currentUser.id,
              userId: currentUser.id,
              username: currentUser.username,
              email: currentUser.email,
              firstName: currentUser.firstName,
              lastName: currentUser.lastName,
              avatar: currentUser.avatar
            },
            {
              id: user.id,
              userId: user.id,
              username: user.username,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              avatar: user.avatar
            }
          ]
        }
      }

      // Close dialog and clear search immediately
      setNewConversationDialogOpen(false)
      setUserSearchTerm('')
      setSearchResults([])
      
      // Ensure ID is definitely set
      let finalConversation = {
        ...fullConversation,
        id: String(fullConversation.id).trim()
      }
      
      // Wait a moment for backend to fully save the conversation
      // Then fetch the full conversation to ensure participants are saved
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Fetch the full conversation one more time to ensure backend has saved everything
      try {
        const finalFetchedConv = await MessagingAPI.getConversation(finalConversation.id)
        if (finalFetchedConv) {
          finalConversation = {
            ...finalFetchedConv,
            id: finalConversation.id
          }
          console.log('Final fetched conversation:', finalConversation)
          console.log('Final participants:', finalConversation.participants)
        }
      } catch (fetchError) {
        console.error('Failed to fetch final conversation:', fetchError)
      }
      
      // Select the conversation immediately
      setSelectedConversation(finalConversation)
      
      // Refresh in parallel (don't wait)
      Promise.all([
        fetchConversations(),
        fetchMessages(finalConversation.id)
      ]).catch(err => console.error('Error refreshing:', err))
      
      toast.success(`Started conversation with ${user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username || user.email}`)
    } catch (error: any) {
      const status = error?.response?.status
      const errorMessage = error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Failed to start conversation'
      
      if (status === 500) {
        toast.error('Server error: Failed to create conversation. Please try again.')
      } else if (status === 400) {
        toast.error(`Bad request: ${errorMessage}`)
      } else if (status === 404) {
        toast.error('Endpoint not found. Please contact support.')
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setCreatingConversation(false)
    }
  }

  const getUserDisplayName = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`
    }
    return user.username || user.email || 'Unknown'
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link to="/">Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Messages</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Conversations List */}
          <div className="w-80 border-r flex flex-col">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold">Messages</h2>
                  {isConnected ? (
                    <span className="h-2 w-2 bg-green-500 rounded-full" title="Real-time connected" />
                  ) : (
                    <span className="h-2 w-2 bg-gray-400 rounded-full" title="Real-time disconnected" />
                  )}
                </div>
                <Button
                  variant="default"
                  size="icon"
                  onClick={() => setNewConversationDialogOpen(true)}
                  className="h-8 w-8"
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
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredConversations.length > 0 ? (
                <div className="divide-y">
                  {filteredConversations.map((conversation) => {
                    const isSelected = selectedConversation?.id === conversation.id
                    const participantName = getParticipantName(conversation)
                    const participantAvatar = getParticipantAvatar(conversation)
                    const lastMessage = conversation.lastMessage
                    const initials = participantName
                      .split(' ')
                      .map((n: string) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)

                    return (
                      <button
                        key={conversation.id}
                        onClick={() => setSelectedConversation(conversation)}
                        className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                          isSelected ? 'bg-muted' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={participantAvatar} />
                            <AvatarFallback>{initials}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium truncate">{participantName}</p>
                              {conversation.unreadCount > 0 && (
                                <span className="bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0">
                                  {conversation.unreadCount}
                                </span>
                              )}
                            </div>
                            {lastMessage && (
                              <>
                                <p className="text-sm text-muted-foreground truncate">
                                  {lastMessage.content}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatTime(lastMessage.createdAt)}
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No conversations found</p>
                </div>
              )}
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Conversation Header */}
                <div className="border-b p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={getParticipantAvatar(selectedConversation)} />
                      <AvatarFallback>
                        {getParticipantName(selectedConversation)
                          .split(' ')
                          .map((n: string) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {getParticipantName(selectedConversation)}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(selectedConversation.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Conversation
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4">
                  {messagesLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-16 w-3/4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : messages.length > 0 ? (
                    <div className="space-y-4">
                      {messages.map((message) => {
                        const isMine = isMyMessage(message)
                        return (
                          <div
                            key={message.id}
                            className={`flex gap-3 ${isMine ? 'flex-row-reverse' : ''}`}
                          >
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarFallback>
                                {isMine ? (
                                  currentUser?.username?.[0]?.toUpperCase() || 'Y'
                                ) : (
                                  getParticipantName(selectedConversation)[0]?.toUpperCase() || 'U'
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[70%]`}>
                              <div
                                className={`rounded-lg px-4 py-2 ${
                                  isMine
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted'
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap break-words">
                                  {message.content}
                                </p>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatMessageTime(message.createdAt)}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No messages yet</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Start the conversation by sending a message
                      </p>
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <div className="border-t p-4">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Input
                      placeholder="Type a message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
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
      </SidebarInset>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this conversation? This action cannot be undone and all messages will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConversation}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* New Conversation Dialog */}
      <Dialog open={newConversationDialogOpen} onOpenChange={setNewConversationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start New Conversation</DialogTitle>
            <DialogDescription>
              Search for a user by username or email to start a new conversation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by username or email..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Search Results */}
            {userSearchTerm.trim().length >= 2 && (
              <div className="border rounded-md max-h-64 overflow-y-auto">
                {creatingConversation ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    <p>Starting conversation...</p>
                  </div>
                ) : searchingUsers ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Searching...
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    <p>No users found</p>
                    <p className="text-xs mt-1">Try searching by username or email</p>
                  </div>
                ) : (
                  <div className="divide-y">
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
                                .map((n: string) => n[0])
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
            )}

            {userSearchTerm.trim().length < 2 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Type at least 2 characters to search for users
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}

