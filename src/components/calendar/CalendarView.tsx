import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Video, 
  BookOpen, 
  Plus,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Users,
  Bell,
  CheckSquare,
  List,
  Flag,
  AlertCircle
} from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { apiService } from '../../services/api';
import { CalendarEvent, VideoConference } from '../../types';
import { TodoList } from './TodoList';

interface TodoItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  category: string;
  tags: string[];
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  estimatedTime?: number;
  actualTime?: number;
  notes?: string;
  relatedEventId?: string;
}

interface CalendarViewProps {
  onEventClick?: (event: CalendarEvent) => void;
  onAddEvent?: () => void;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  onEventClick,
  onAddEvent
}) => {
  const { user } = useAuthStore();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [activeTab, setActiveTab] = useState<'calendar' | 'todos'>('calendar');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, [currentDate, view]);

  // Convert todos to calendar events
  useEffect(() => {
    const todoEvents: CalendarEvent[] = todos
      .filter(todo => todo.dueDate && !todo.completed) // Only show incomplete todos with due dates
      .map(todo => ({
        id: `todo-${todo.id}`,
        userId: todo.assignedTo || user?.id || '',
        title: todo.title,
        description: todo.description || `Priority: ${todo.priority} | Category: ${todo.category}`,
        startTime: todo.dueDate!,
        endTime: todo.dueDate!,
        type: 'todo' as const,
        priority: todo.priority,
        category: todo.category,
        tags: todo.tags,
        estimatedTime: todo.estimatedTime
      }));

    // Combine regular events with todo events
    const allEvents = [...events.filter(event => event.type !== 'todo'), ...todoEvents];
    setEvents(allEvents);
  }, [todos, user?.id]);

  const loadEvents = async () => {
    try {
      const calendarEvents = await apiService.getCalendarEvents();
      setEvents(calendarEvents);
    } catch (error) {
      console.error('Error loading calendar events:', error);
      // Mock data for demo
      setEvents([
        {
          id: '1',
          userId: user?.id || '',
          title: 'React Fundamentals - Lesson 1',
          description: 'Introduction to React components and JSX',
          startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
          type: 'lesson'
        },
        {
          id: '2',
          userId: user?.id || '',
          title: 'JavaScript Quiz',
          description: 'Assessment on JavaScript fundamentals',
          startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
          type: 'quiz'
        },
        {
          id: '3',
          userId: user?.id || '',
          title: 'Team Study Session',
          description: 'Group study session for advanced topics',
          startTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 48 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
          type: 'study'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date): CalendarDay[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days: CalendarDay[] = [];
    
    // Add previous month's days
    for (let i = startingDay - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }
    
    // Add current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      const currentDate = new Date(year, month, i);
      days.push({ date: currentDate, isCurrentMonth: true });
    }
    
    // Add next month's days to fill the grid
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({ date: nextDate, isCurrentMonth: false });
    }
    
    return days;
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'lesson': return <BookOpen className="h-3 w-3" />;
      case 'quiz': return <Clock className="h-3 w-3" />;
      case 'video': return <Video className="h-3 w-3" />;
      case 'study': return <Users className="h-3 w-3" />;
      case 'todo': return <CheckSquare className="h-3 w-3" />;
      default: return <CalendarIcon className="h-3 w-3" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'lesson': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'quiz': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'video': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'study': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'todo': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const isToday = (date: Date) => {
    return date.toDateString() === new Date().toDateString();
  };

  const isSelected = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const days = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header with Tabs */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Calendar & Tasks</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setActiveTab('calendar')}
                className={`flex items-center px-3 py-1 text-sm rounded-md transition-colors ${
                  activeTab === 'calendar' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <CalendarIcon className="h-4 w-4 mr-1" />
                Calendar
              </button>
              <button
                onClick={() => setActiveTab('todos')}
                className={`flex items-center px-3 py-1 text-sm rounded-md transition-colors ${
                  activeTab === 'todos' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <CheckSquare className="h-4 w-4 mr-1" />
                To-Do List
              </button>
            </div>
          </div>
          
          {activeTab === 'calendar' && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setView('month')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    view === 'month' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Month
                </button>
                <button
                  onClick={() => setView('week')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    view === 'week' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => setView('day')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    view === 'day' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Day
                </button>
              </div>
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">{monthName}</h3>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <button
                onClick={onAddEvent}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'calendar' ? (
        <>
          {/* Calendar Grid */}
          <div className="p-6">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => {
                const dayEvents = getEventsForDate(day.date);
                return (
                  <div
                    key={index}
                    onClick={() => setSelectedDate(day.date)}
                    className={`min-h-[120px] p-2 border border-gray-200 dark:border-gray-600 cursor-pointer transition-colors ${
                      !day.isCurrentMonth 
                        ? 'bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-600' 
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    } ${
                      isToday(day.date) 
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600' 
                        : ''
                    } ${
                      isSelected(day.date) 
                        ? 'ring-2 ring-blue-500' 
                        : ''
                    }`}
                  >
                    <div className="text-sm font-medium mb-1">
                      {day.date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map(event => (
                        <div
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick?.(event);
                          }}
                          className={`flex items-center p-1 rounded text-xs cursor-pointer ${getEventColor(event.type)}`}
                        >
                          {getEventIcon(event.type)}
                          <span className="ml-1 truncate">{event.title}</span>
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Date Events */}
          {selectedDate && (
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Events for {selectedDate.toLocaleDateString()}
              </h4>
              <div className="space-y-3">
                {getEventsForDate(selectedDate).map(event => (
                  <div
                    key={event.id}
                    className="flex items-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => onEventClick?.(event)}
                  >
                    <div className={`p-2 rounded-lg ${getEventColor(event.type)}`}>
                      {getEventIcon(event.type)}
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium text-gray-900 dark:text-white">{event.title}</h5>
                        {event.type === 'todo' && event.priority && (
                          <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            event.priority === 'urgent' ? 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900' :
                            event.priority === 'high' ? 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900' :
                            event.priority === 'medium' ? 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900' :
                            'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900'
                          }`}>
                            {event.priority === 'urgent' ? <AlertCircle className="h-3 w-3 mr-1" /> :
                             event.priority === 'high' ? <Flag className="h-3 w-3 mr-1" /> :
                             event.priority === 'medium' ? <Clock className="h-3 w-3 mr-1" /> :
                             <CheckSquare className="h-3 w-3 mr-1" />}
                            <span className="capitalize">{event.priority}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{event.description}</p>
                      <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatTime(event.startTime)} - {formatTime(event.endTime)}
                        {event.type === 'todo' && event.estimatedTime && (
                          <span className="ml-2">
                            • Est: {Math.floor(event.estimatedTime / 60)}h {event.estimatedTime % 60}m
                          </span>
                        )}
                      </div>
                      {event.type === 'todo' && event.tags && event.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {event.tags.slice(0, 3).map(tag => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs"
                            >
                              #{tag}
                            </span>
                          ))}
                          {event.tags.length > 3 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              +{event.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      <Bell className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {getEventsForDate(selectedDate).length === 0 && (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                    No events scheduled for this date
                  </p>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        /* Todo List View */
        <div className="p-6">
          <TodoList 
            selectedDate={selectedDate || undefined}
            onTodoClick={(todo) => {
              // Handle todo click - could open edit modal or show details
              console.log('Todo clicked:', todo);
            }}
            onAddTodo={() => {
              // Handle add todo - could open add modal
              console.log('Add todo clicked');
            }}
            onTodosChange={setTodos}
          />
        </div>
      )}
    </div>
  );
}; 