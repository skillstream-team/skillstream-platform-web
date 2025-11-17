import React, { useState, useEffect } from 'react';
import { CalendarEvent } from '../types';
import { getCalendarEvents, getMyCalendarEvents, createCalendarEvent, joinCalendarEvent } from '../services/api';
import { BackButton } from '../components/common/BackButton';
import { TodoList } from '../components/calendar/TodoList';
import { 
  PlusIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  CheckCircleIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  BookOpenIcon,
  FlagIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

interface FilterState {
  eventTypes: Set<string>;
  priorities: Set<string>;
  categories: Set<string>;
}

const CalendarPage: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    eventTypes: new Set(['lesson', 'quiz', 'video', 'study', 'assignment', 'exam', 'todo']),
    priorities: new Set(['low', 'medium', 'high', 'urgent']),
    categories: new Set()
  });
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    type: 'study' as CalendarEvent['type'],
    location: '',
    priority: 'medium' as CalendarEvent['priority'],
    category: '',
    tags: [] as string[]
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      // Get events for the current month
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0];
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0];
      
      const eventsData = await getCalendarEvents({
        startDate,
        endDate
      });
      setEvents(eventsData);
    } catch (error) {
      console.error('Failed to load events:', error);
      setError('Failed to load calendar events');
      setEvents([]); // Show empty state on error
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEvent.title || !newEvent.startTime || !newEvent.endTime) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const event = await createCalendarEvent({
        title: newEvent.title,
        description: newEvent.description,
        startTime: newEvent.startTime,
        endTime: newEvent.endTime,
        type: (() => {
          const typeMap: Record<string, 'live_class' | 'deadline' | 'assignment_due' | 'quiz_due' | 'custom'> = {
            'lesson': 'live_class',
            'assignment': 'assignment_due',
            'quiz': 'quiz_due',
            'exam': 'quiz_due',
            'study': 'custom',
            'video': 'live_class',
            'todo': 'deadline'
          };
          return typeMap[newEvent.type] || 'custom';
        })(),
        location: newEvent.location,
        courseId: newEvent.category, // Use category as courseId if it's a course-related event
        isRecurring: false
      });
      
      setEvents(prev => [...prev, event]);
      setNewEvent({
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        type: 'study',
        location: '',
        priority: 'medium',
        category: '',
        tags: []
      });
      setShowEventModal(false);
      setError('');
    } catch (error) {
      console.error('Failed to create event:', error);
      setError('Failed to create event');
    }
  };

  const getEventsForDate = (date: Date) => {
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
      categories: new Set()
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

  const getEventTypeIcon = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'lesson':
        return <AcademicCapIcon className="w-4 h-4" />;
      case 'quiz':
        return <DocumentTextIcon className="w-4 h-4" />;
      case 'video':
        return <VideoCameraIcon className="w-4 h-4" />;
      case 'study':
        return <BookOpenIcon className="w-4 h-4" />;
      case 'assignment':
        return <DocumentTextIcon className="w-4 h-4" />;
      case 'exam':
        return <FlagIcon className="w-4 h-4" />;
      case 'todo':
        return <CheckCircleIcon className="w-4 h-4" />;
      default:
        return <CalendarIcon className="w-4 h-4" />;
    }
  };

  const getEventTypeColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'lesson':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'quiz':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'video':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'study':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'assignment':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'exam':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'todo':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getPriorityColor = (priority: CalendarEvent['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-4 border-red-500';
      case 'high':
        return 'border-l-4 border-orange-500';
      case 'medium':
        return 'border-l-4 border-yellow-500';
      case 'low':
        return 'border-l-4 border-green-500';
      default:
        return '';
    }
  };

  const generateCalendarDays = (): Date[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: Date[] = [];
    const currentDay = new Date(startDate);
    
    while (currentDay <= lastDay || currentDay.getDay() !== 0) {
      days.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    return days;
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-7 gap-4">
              {[...Array(35)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const calendarDays = generateCalendarDays();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <BackButton showHome />
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Calendar</h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Manage your schedule and upcoming events
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowEventModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              New Event
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar Section */}
          <div className="lg:col-span-2 flex flex-col">
            {/* Calendar Navigation */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ←
                </button>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <button
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  →
                </button>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                    showFilters 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <FunnelIcon className="h-4 w-4 mr-2" />
                  Filters
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
                >
                  Today
                </button>
              </div>
            </div>

            {/* Interactive Legend and Filters */}
            {showFilters && (
              <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Filter Events</h4>
                  <button
                    onClick={clearAllFilters}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Clear All
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Event Types */}
                  <div>
                    <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Event Types</h5>
                    <div className="space-y-1">
                      {getEventTypes().map(type => (
                        <label key={type} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.eventTypes.has(type)}
                            onChange={() => toggleFilter('eventTypes', type)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
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
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
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
                      {getCategories().map(category => (
                        <label key={category} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.categories.has(category)}
                            onChange={() => toggleFilter('categories', category)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-xs text-gray-700 dark:text-gray-300">{category}</span>
                        </label>
                      ))}
                      {getCategories().length === 0 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">No categories available</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Calendar Grid */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex-1">
              {/* Day Headers */}
              <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-700">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 flex-1">
                {calendarDays.map((day, index) => {
                  const dayEvents = getEventsForDate(day);
                  const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                  const isToday = day.toDateString() === new Date().toDateString();
                  const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();
                  const hasUrgentEvents = dayEvents.some(event => event.priority === 'urgent');
                  const hasHighPriorityEvents = dayEvents.some(event => event.priority === 'high');

                  return (
                    <div
                      key={index}
                      onClick={() => setSelectedDate(day)}
                      className={`min-h-32 p-1 border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 flex flex-col ${
                        !isCurrentMonth ? 'bg-gray-50 dark:bg-gray-900 text-gray-400' : ''
                      } ${isToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''} ${
                        isSelected ? 'ring-2 ring-indigo-500' : ''
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
                          {day.getDate()}
                        </div>
                        {hasUrgentEvents && (
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        )}
                        {!hasUrgentEvents && hasHighPriorityEvents && (
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        )}
                      </div>
                      <div className="space-y-1 flex-1">
                        {dayEvents.slice(0, 3).map((event) => (
                          <div
                            key={event.id}
                            className={`text-xs p-1 rounded truncate ${getEventTypeColor(event.type)} ${
                              event.priority === 'urgent' ? 'border-l-2 border-red-500' :
                              event.priority === 'high' ? 'border-l-2 border-orange-500' :
                              event.priority === 'medium' ? 'border-l-2 border-yellow-500' :
                              event.priority === 'low' ? 'border-l-2 border-green-500' : ''
                            }`}
                            title={`${event.title}${event.priority ? ` (${event.priority} priority)` : ''}`}
                          >
                            <div className="flex items-center space-x-1">
                              {getEventTypeIcon(event.type)}
                              <span className="truncate">{event.title}</span>
                            </div>
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
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Events for {selectedDate.toLocaleDateString()}
                </h3>
                <div className="space-y-3">
                  {getEventsForDate(selectedDate).length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400">No events scheduled for this date.</p>
                  ) : (
                    getEventsForDate(selectedDate).map((event) => (
                      <div
                        key={event.id}
                        className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 ${getPriorityColor(event.priority)}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              {getEventTypeIcon(event.type)}
                              <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                                {event.title}
                              </h4>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEventTypeColor(event.type)}`}>
                                {event.type}
                              </span>
                            </div>
                            {event.description && (
                              <p className="text-gray-600 dark:text-gray-400 mb-3">
                                {event.description}
                              </p>
                            )}
                            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                              <div className="flex items-center">
                                <ClockIcon className="w-4 h-4 mr-1" />
                                {formatTime(event.startTime)} - {formatTime(event.endTime)}
                              </div>
                              {event.location && (
                                <div className="flex items-center">
                                  <MapPinIcon className="w-4 h-4 mr-1" />
                                  {event.location}
                                </div>
                              )}
                              {event.attendees && event.attendees.length > 0 && (
                                <div className="flex items-center">
                                  <UserGroupIcon className="w-4 h-4 mr-1" />
                                  {event.attendees.length} attendees
                                </div>
                              )}
                            </div>
                            {event.tags && event.tags.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-1">
                                {event.tags.map((tag, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Todo List Section */}
          <div className="lg:col-span-1 flex flex-col">
            <div className="flex-1">
              <TodoList 
                selectedDate={selectedDate || undefined}
                onTodosChange={(todos) => {
                  console.log('Todos changed:', todos);
                  // Handle todos change
                }}
              />
            </div>
          </div>
        </div>

        {/* Create Event Modal */}
        {showEventModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Create New Event
              </h2>
              <form onSubmit={handleCreateEvent}>
                {error && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                    <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                  </div>
                )}
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      value={newEvent.description}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Start Time *
                      </label>
                      <input
                        type="datetime-local"
                        value={newEvent.startTime}
                        onChange={(e) => setNewEvent(prev => ({ ...prev, startTime: e.target.value }))}
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        End Time *
                      </label>
                      <input
                        type="datetime-local"
                        value={newEvent.endTime}
                        onChange={(e) => setNewEvent(prev => ({ ...prev, endTime: e.target.value }))}
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Type
                    </label>
                    <select
                      value={newEvent.type}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, type: e.target.value as CalendarEvent['type'] }))}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="study">Study</option>
                      <option value="lesson">Lesson</option>
                      <option value="quiz">Quiz</option>
                      <option value="video">Video Call</option>
                      <option value="assignment">Assignment</option>
                      <option value="exam">Exam</option>
                      <option value="todo">Todo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={newEvent.location}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Priority
                    </label>
                    <select
                      value={newEvent.priority}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, priority: e.target.value as CalendarEvent['priority'] }))}
                      className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEventModal(false);
                      setNewEvent({
                        title: '',
                        description: '',
                        startTime: '',
                        endTime: '',
                        type: 'study',
                        location: '',
                        priority: 'medium',
                        category: '',
                        tags: []
                      });
                      setError('');
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Create Event
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarPage; 