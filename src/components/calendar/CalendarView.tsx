import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Video, 
  BookOpen, 
  Plus,
  ChevronLeft,
  ChevronRight,
  Users,
  Bell,
  CheckSquare,
  List,
  Flag,
  AlertCircle,
  Filter
} from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { apiService } from '../../services/api';
import { CalendarEvent } from '../../types';
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

interface FilterState {
  eventTypes: Set<string>;
  priorities: Set<string>;
  categories: Set<string>;
  showCompleted: boolean;
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
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    eventTypes: new Set(['lesson', 'quiz', 'video', 'study', 'assignment', 'exam', 'todo']),
    priorities: new Set(['low', 'medium', 'high', 'urgent']),
    categories: new Set(),
    showCompleted: false
  });

  useEffect(() => {
    loadEvents();
  }, [currentDate, view]);

  // Convert todos to calendar events
  useEffect(() => {
    const todoEvents: CalendarEvent[] = todos
      .filter(todo => todo.dueDate && (filters.showCompleted || !todo.completed)) // Filter by completion status
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
  }, [todos, user?.id, filters.showCompleted]);

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
          type: 'lesson',
          category: 'Programming',
          priority: 'high'
        },
        {
          id: '2',
          userId: user?.id || '',
          title: 'JavaScript Quiz',
          description: 'Assessment on JavaScript fundamentals',
          startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
          type: 'quiz',
          category: 'Assessment',
          priority: 'urgent'
        },
        {
          id: '3',
          userId: user?.id || '',
          title: 'Team Study Session',
          description: 'Group study session for advanced topics',
          startTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 48 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
          type: 'study',
          category: 'Collaboration',
          priority: 'medium'
        },
        {
          id: '4',
          userId: user?.id || '',
          title: 'Personal Project Review',
          description: 'Review personal coding project',
          startTime: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 72 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString(),
          type: 'assignment',
          category: 'Personal',
          priority: 'low'
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

  const getFilteredEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.startTime);
      const dateMatch = eventDate.toDateString() === date.toDateString();
      
      if (!dateMatch) return false;
      
      // Apply filters
      const typeMatch = filters.eventTypes.has(event.type);
      const priorityMatch = !event.priority || filters.priorities.has(event.priority);
      const categoryMatch = !event.category || filters.categories.size === 0 || filters.categories.has(event.category);
      
      return typeMatch && priorityMatch && categoryMatch;
    });
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'lesson': return <BookOpen className="h-3 w-3" />;
      case 'quiz': return <Clock className="h-3 w-3" />;
      case 'video': return <Video className="h-3 w-3" />;
      case 'study': return <Users className="h-3 w-3" />;
      case 'todo': return <CheckSquare className="h-3 w-3" />;
      case 'assignment': return <List className="h-3 w-3" />;
      case 'exam': return <AlertCircle className="h-3 w-3" />;
      default: return <CalendarIcon className="h-3 w-3" />;
    }
  };

  const getEventColor = (type: string, priority?: string) => {
    // Base colors by type
    let baseColor = '';
    switch (type) {
      case 'lesson': baseColor = 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'; break;
      case 'quiz': baseColor = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'; break;
      case 'video': baseColor = 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'; break;
      case 'study': baseColor = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'; break;
      case 'todo': baseColor = 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'; break;
      case 'assignment': baseColor = 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'; break;
      case 'exam': baseColor = 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200'; break;
      default: baseColor = 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'; break;
    }

    // Add priority indicators
    if (priority === 'urgent') {
      baseColor += ' border-l-4 border-red-500';
    } else if (priority === 'high') {
      baseColor += ' border-l-4 border-orange-500';
    } else if (priority === 'medium') {
      baseColor += ' border-l-4 border-yellow-500';
    } else if (priority === 'low') {
      baseColor += ' border-l-4 border-green-500';
    }

    return baseColor;
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

  const toggleFilter = (filterType: 'eventTypes' | 'priorities' | 'categories', value: string) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      const currentSet = new Set(newFilters[filterType]);
      
      if (currentSet.has(value)) {
        currentSet.delete(value);
      } else {
        currentSet.add(value);
      }
      
      newFilters[filterType] = currentSet;
      return newFilters;
    });
  };

  const clearAllFilters = () => {
    setFilters({
      eventTypes: new Set(['lesson', 'quiz', 'video', 'study', 'assignment', 'exam', 'todo']),
      priorities: new Set(['low', 'medium', 'high', 'urgent']),
      categories: new Set(),
      showCompleted: false
    });
  };

  const getEventTypes = () => {
    const types = new Set(events.map(event => event.type));
    return Array.from(types);
  };

  const getCategories = () => {
    const categories = new Set(events.map(event => event.category).filter((category): category is string => Boolean(category)));
    return Array.from(categories);
  };

  const getEventDisplayInfo = (event: CalendarEvent) => {
    const icon = getEventIcon(event.type);
    const color = getEventColor(event.type, event.priority);
    const priorityIndicator = event.priority === 'urgent' ? '🔥' : 
                             event.priority === 'high' ? '⚡' : 
                             event.priority === 'medium' ? '📌' : '';
    
    return { icon, color, priorityIndicator };
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
  const eventTypes = getEventTypes();
  const categories = getCategories();

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
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                  showFilters 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </button>
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
          {/* Interactive Legend and Filters */}
          {showFilters && (
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">Filter Events</h4>
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Clear All
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Event Types */}
                <div>
                  <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Event Types</h5>
                  <div className="space-y-1">
                    {eventTypes.map(type => (
                      <label key={type} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.eventTypes.has(type)}
                          onChange={() => toggleFilter('eventTypes', type)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs text-gray-700 dark:text-gray-300 capitalize">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Priorities */}
                <div>
                  <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Priorities</h5>
                  <div className="space-y-1">
                    {['urgent', 'high', 'medium', 'low'].map(priority => (
                      <label key={priority} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.priorities.has(priority)}
                          onChange={() => toggleFilter('priorities', priority)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs text-gray-700 dark:text-gray-300 capitalize">{priority}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Categories</h5>
                  <div className="space-y-1">
                    {categories.map(category => (
                      <label key={category} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.categories.has(category)}
                          onChange={() => toggleFilter('categories', category)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs text-gray-700 dark:text-gray-300">{category}</span>
                      </label>
                    ))}
                    {categories.length === 0 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">No categories available</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Show Completed Toggle */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.showCompleted}
                    onChange={() => setFilters(prev => ({ ...prev, showCompleted: !prev.showCompleted }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-700 dark:text-gray-300">Show completed todos</span>
                </label>
              </div>
            </div>
          )}

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
                const dayEvents = getFilteredEventsForDate(day.date);
                const hasUrgentEvents = dayEvents.some(event => event.priority === 'urgent');
                const hasHighPriorityEvents = dayEvents.some(event => event.priority === 'high');
                
                return (
                  <div
                    key={index}
                    onClick={() => setSelectedDate(day.date)}
                    className={`min-h-[140px] p-2 border border-gray-200 dark:border-gray-600 cursor-pointer transition-colors ${
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
                    } ${
                      hasUrgentEvents 
                        ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-700' 
                        : hasHighPriorityEvents 
                        ? 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-700' 
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm font-medium">
                        {day.date.getDate()}
                      </div>
                      {hasUrgentEvents && (
                        <div className="text-red-500 text-xs">🔥</div>
                      )}
                      {!hasUrgentEvents && hasHighPriorityEvents && (
                        <div className="text-orange-500 text-xs">⚡</div>
                      )}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 4).map(event => {
                        const { icon, color, priorityIndicator } = getEventDisplayInfo(event);
                        return (
                          <div
                            key={event.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onEventClick?.(event);
                            }}
                            className={`flex items-center p-1.5 rounded text-xs cursor-pointer transition-all hover:scale-105 ${color}`}
                            title={`${event.title}${event.description ? ` - ${event.description}` : ''}`}
                          >
                            {icon}
                            <span className="ml-1 truncate flex-1">{event.title}</span>
                            {priorityIndicator && (
                              <span className="ml-1 text-xs">{priorityIndicator}</span>
                            )}
                          </div>
                        );
                      })}
                      {dayEvents.length > 4 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-1 bg-gray-100 dark:bg-gray-700 rounded">
                          +{dayEvents.length - 4} more
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
                {getFilteredEventsForDate(selectedDate).map(event => {
                  const { icon, color, priorityIndicator } = getEventDisplayInfo(event);
                  return (
                    <div
                      key={event.id}
                      className="flex items-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-all"
                      onClick={() => onEventClick?.(event)}
                    >
                      <div className={`p-2 rounded-lg ${color}`}>
                        {icon}
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium text-gray-900 dark:text-white flex items-center">
                            {event.title}
                            {priorityIndicator && (
                              <span className="ml-2 text-sm">{priorityIndicator}</span>
                            )}
                          </h5>
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
                  );
                })}
                {getFilteredEventsForDate(selectedDate).length === 0 && (
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