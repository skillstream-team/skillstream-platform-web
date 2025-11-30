import React, { useState, useEffect } from 'react';
import { CalendarEvent } from '../types';
import { getCalendarEvents, createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '../services/api';
import { BackButton } from '../components/common/BackButton';
import { TodoList } from '../components/calendar/TodoList';
import { 
  PlusIcon,
  CalendarIcon,
  CheckCircleIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  BookOpenIcon,
  FlagIcon,
  PencilIcon,
  XMarkIcon,
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
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
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
  }, [currentDate]); // Reload when month changes

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      // Get events for the current month (with buffer for events spanning months)
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0).toISOString().split('T')[0];
      
      console.log('Loading events from', startDate, 'to', endDate, 'for month', currentDate.getMonth() + 1);
      
      const eventsData = await getCalendarEvents({
        startDate,
        endDate
      });
      
      console.log('Loaded', eventsData?.length || 0, 'events');
      console.log('Events:', eventsData);
      
      setEvents(eventsData || []); // Ensure it's always an array
    } catch (error) {
      console.error('Failed to load events:', error);
      setError('Failed to load calendar events. Please try again.');
      setEvents([]); // Show empty state on error
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEvent.title || !newEvent.startTime || !newEvent.endTime) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      // Convert datetime-local format to ISO string if needed
      const startTimeISO = newEvent.startTime.includes('T') 
        ? new Date(newEvent.startTime).toISOString() 
        : newEvent.startTime;
      const endTimeISO = newEvent.endTime.includes('T')
        ? new Date(newEvent.endTime).toISOString()
        : newEvent.endTime;

      console.log('Creating event with data:', {
        title: newEvent.title,
        startTime: startTimeISO,
        endTime: endTimeISO,
        type: newEvent.type
      });

      if (editingEventId) {
        const updates: Partial<CalendarEvent> = {
          title: newEvent.title,
          description: newEvent.description,
          startTime: startTimeISO,
          endTime: endTimeISO,
          location: newEvent.location,
          priority: newEvent.priority,
          category: newEvent.category,
          tags: newEvent.tags
        };
        const updated = await updateCalendarEvent(editingEventId, updates);
        // Reload events to ensure we have the latest data from the server
        await loadEvents();
      } else {
        const eventData = {
          title: newEvent.title,
          description: newEvent.description || undefined,
          startTime: startTimeISO,
          endTime: endTimeISO,
          type: (() => {
            const typeMap: Record<string, 'live_class' | 'deadline' | 'assignment_due' | 'quiz_due' | 'custom'> = {
                lesson: 'live_class',
                assignment: 'assignment_due',
                quiz: 'quiz_due',
                exam: 'quiz_due',
                study: 'custom',
                video: 'live_class',
                todo: 'deadline'
            };
            return typeMap[newEvent.type] || 'custom';
          })(),
          location: newEvent.location || undefined,
          courseId: newEvent.category || undefined,
          isRecurring: false
        };
        
        console.log('Sending event data to API:', eventData);
        
        const event = await createCalendarEvent(eventData);
        // Reload events to ensure we have the latest data from the server
        await loadEvents();
      }
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
      setEditingEventId(null);
      setShowEventModal(false);
      setError('');
    } catch (error: any) {
      console.error('Failed to save event:', error);
      console.error('Error response:', error?.response);
      console.error('Error data:', error?.response?.data);
      console.error('Error status:', error?.response?.status);
      console.error('Request data that failed:', {
        title: newEvent.title,
        startTime: newEvent.startTime,
        endTime: newEvent.endTime,
        type: newEvent.type
      });
      
      let errorMessage = 'Failed to save event. Please try again.';
      
      if (error?.response?.status === 403 || error?.response?.status === 401) {
        errorMessage = 'You do not have permission to create events. Please ensure you are logged in.';
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.status === 400) {
        errorMessage = 'Invalid event data. Please check all fields and try again.';
      } else if (error?.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (!error?.response) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      setError(errorMessage);
      
      // Keep modal open so user can see the error and try again
      // Don't close the modal on error
    }
  };

  // Map API event types to display types for filtering
  const getDisplayType = (apiType: string): string => {
    const typeMap: Record<string, string> = {
      'live_class': 'lesson',
      'deadline': 'todo',
      'assignment_due': 'assignment',
      'quiz_due': 'quiz',
      'custom': 'study'
    };
    return typeMap[apiType] || apiType;
  };

  const getEventsForDate = (date: Date) => {
    if (!events || events.length === 0) {
      return [];
    }
    
    return events.filter(event => {
      if (!event || !event.startTime) {
        return false;
      }
      
      // Handle date comparison with timezone issues - normalize to local date
      try {
        const eventDate = new Date(event.startTime);
        if (isNaN(eventDate.getTime())) {
          console.warn('Invalid event date:', event.startTime);
          return false;
        }
        
        const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
        const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dateMatch = eventDateOnly.getTime() === dateOnly.getTime();
        
        if (!dateMatch) return false;
        
        // Apply filters - map API types to display types
        const displayType = getDisplayType(event.type);
        
        // Event type filter: must match either the display type (e.g., 'lesson') or the API type (e.g., 'live_class')
        const typeMatch = filters.eventTypes.has(displayType) || filters.eventTypes.has(event.type);
        
        // Priority filter: if event has a priority, it must be in the filter set
        // If event has no priority, it passes (we don't filter out events without priority)
        const priorityMatch = !event.priority || filters.priorities.has(event.priority);
        
        // Category filter: if no categories are selected, show all; otherwise event must match
        const categoryMatch = filters.categories.size === 0 || !event.category || filters.categories.has(event.category);
        
        const passesAllFilters = typeMatch && priorityMatch && categoryMatch;
        
        return passesAllFilters;
      } catch (error) {
        console.error('Error filtering event:', error, event);
        return false;
      }
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

  // Map API type back to form type for editing
  const getFormTypeFromApi = (apiType: string): string => {
    const typeMap: Record<string, string> = {
      'live_class': 'lesson',
      'deadline': 'todo',
      'assignment_due': 'assignment',
      'quiz_due': 'quiz',
      'custom': 'study'
    };
    return typeMap[apiType] || 'study';
  };

  const openEditModal = (event: CalendarEvent) => {
    setEditingEventId(event.id);
    setNewEvent({
      title: event.title,
      description: event.description || '',
      startTime: event.startTime ? event.startTime.slice(0, 16) : '',
      endTime: event.endTime ? event.endTime.slice(0, 16) : '',
      type: getFormTypeFromApi(event.type) as any,
      location: event.location || '',
      priority: event.priority || 'medium',
      category: event.category || '',
      tags: event.tags || []
    });
    setShowEventModal(true);
    setError('');
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      await deleteCalendarEvent(eventId);
      setEvents(prev => prev.filter(ev => ev.id !== eventId));
    } catch (err) {
      console.error('Failed to delete event:', err);
      setError('Failed to delete event');
    }
  };

  // Map API types to display types for icons/colors
  const getDisplayTypeFromApi = (apiType: string): string => {
    const typeMap: Record<string, string> = {
      'live_class': 'lesson',
      'deadline': 'todo',
      'assignment_due': 'assignment',
      'quiz_due': 'quiz',
      'custom': 'study'
    };
    return typeMap[apiType] || apiType;
  };

  const getEventTypeIcon = (type: string) => {
    const displayType = getDisplayTypeFromApi(type);
    switch (displayType) {
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

  const getEventTypeColor = (type: string) => {
    const displayType = getDisplayTypeFromApi(type);
    switch (displayType) {
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
    try {
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
    } catch (error) {
      console.error('Error generating calendar days:', error);
      return []; // Return empty array on error
    }
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      {/* Header Section */}
      <div className="courses-header" style={{ marginBottom: '2rem' }}>
        <div className="courses-header-content">
          <div className="courses-header-text">
            <h1 className="courses-header-title">
              Schedule & Calendar
            </h1>
            <p className="courses-header-subtitle">
              Manage your lessons, assignments, and important dates
                </p>
              </div>
          <button
            onClick={() => {
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
              setEditingEventId(null);
              setShowEventModal(true);
            }}
            className="courses-create-button"
          >
            <PlusIcon className="courses-create-button-icon" style={{ width: '1rem', height: '1rem' }} />
            Add Event
          </button>
            </div>
      </div>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar View */}
          <div className="lg:col-span-2">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-6">
            <button
                onClick={() => {
                  const newDate = new Date(currentDate);
                  newDate.setMonth(newDate.getMonth() - 1);
                  setCurrentDate(newDate);
                }}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <span className="text-gray-600 dark:text-gray-400">← Previous</span>
              </button>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <button
                onClick={() => {
                  const newDate = new Date(currentDate);
                  newDate.setMonth(newDate.getMonth() + 1);
                  setCurrentDate(newDate);
                }}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <span className="text-gray-600 dark:text-gray-400">Next →</span>
            </button>
          </div>
            
            {/* Calendar Grid */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700">
                {/* Day Headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="bg-gray-50 dark:bg-gray-800 p-2 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {day}
        </div>
                ))}
                
                {/* Calendar Days */}
                {calendarDays.map((day, index) => {
                  const dayEvents = getEventsForDate(day);
                  const isToday = day.toDateString() === new Date().toDateString();
                  const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                  const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();
                  
                  return (
                    <div
                      key={index}
                      onClick={() => setSelectedDate(day)}
                      className={`min-h-24 p-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 cursor-pointer transition-colors ${
                        isSelected ? 'ring-2 ring-blue-500' : ''
                      } ${isToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''} ${
                        !isCurrentMonth ? 'opacity-50' : ''
                      }`}
                    >
                      <div className={`text-sm font-medium mb-1 ${
                        isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'
                      }`}>
                        {day.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 2).map(event => (
                          <div
                            key={event.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setNewEvent({
                                title: event.title,
                                description: event.description || '',
                                startTime: event.startTime ? event.startTime.slice(0, 16) : '',
                                endTime: event.endTime ? event.endTime.slice(0, 16) : '',
                                type: event.type,
                                location: event.location || '',
                                priority: event.priority || 'medium',
                                category: event.category || '',
                                tags: event.tags || []
                              });
                              setEditingEventId(event.id);
                              setShowEventModal(true);
                            }}
                            className={`text-xs p-1 rounded truncate ${
                              getEventTypeColor(event.type)
                            }`}
                            title={event.title}
                          >
                            {getEventTypeIcon(event.type)}
                            <span className="ml-1">{event.title}</span>
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            +{dayEvents.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Filters - Always Visible and Above Selected Date */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Filters</h3>
                {(filters.eventTypes.size < 7 || filters.priorities.size < 4) && (
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Reset
                  </button>
                )}
              </div>
              <div className="space-y-4">
                {/* Event Type Filters - Compact Button Style */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Event Types</h4>
                  <div className="flex flex-wrap gap-2">
                    {['lesson', 'quiz', 'video', 'study', 'assignment', 'exam', 'todo'].map(type => (
                      <button
                        key={type}
                        onClick={() => toggleFilter('eventTypes', type)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          filters.eventTypes.has(type)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Priority Filters - Compact Button Style */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Priority</h4>
                  <div className="flex flex-wrap gap-2">
                    {['low', 'medium', 'high', 'urgent'].map(priority => (
                      <button
                        key={priority}
                        onClick={() => toggleFilter('priorities', priority)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          filters.priorities.has(priority)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Selected Date Events - Below Filters */}
            {selectedDate && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </h3>
                  <button
                    onClick={() => {
                      setNewEvent({
                        title: '',
                        description: '',
                        startTime: `${selectedDate.toISOString().split('T')[0]}T09:00`,
                        endTime: `${selectedDate.toISOString().split('T')[0]}T10:00`,
                        type: 'study',
                        location: '',
                        priority: 'medium',
                        category: '',
                        tags: []
                      });
                      setEditingEventId(null);
                      setShowEventModal(true);
                    }}
                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  >
                    <PlusIcon className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-2">
                  {getEventsForDate(selectedDate).map(event => (
                      <div
                        key={event.id}
                        className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {getEventTypeIcon(event.type)}
                              <h4 className="font-medium text-gray-900 dark:text-white">{event.title}</h4>
                            </div>
                            {event.startTime && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {formatTime(event.startTime)}
                              </p>
                            )}
                            {event.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{event.description}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEditModal(event)}
                              className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteEvent(event.id)}
                              className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  {getEventsForDate(selectedDate).length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      {events.length === 0 
                        ? 'No events scheduled for this day'
                        : 'No events match the current filters'}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {editingEventId ? 'Edit Event' : 'Create New Event'}
                </h2>
                <button
                  onClick={() => {
                    setShowEventModal(false);
                    setEditingEventId(null);
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
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleSaveEvent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Start Time *
                    </label>
                    <input
                      type="datetime-local"
                      value={newEvent.startTime}
                      onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      End Time *
                    </label>
                    <input
                      type="datetime-local"
                      value={newEvent.endTime}
                      onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Type
                    </label>
                    <select
                      value={newEvent.type}
                      onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as CalendarEvent['type'] })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="study">Study</option>
                      <option value="lesson">Lesson</option>
                      <option value="quiz">Quiz</option>
                      <option value="assignment">Assignment</option>
                      <option value="exam">Exam</option>
                      <option value="video">Video</option>
                      <option value="todo">Todo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Priority
                    </label>
                    <select
                      value={newEvent.priority}
                      onChange={(e) => setNewEvent({ ...newEvent, priority: e.target.value as CalendarEvent['priority'] })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                  </div>
                )}
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    {editingEventId ? 'Update Event' : 'Create Event'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEventModal(false);
                      setEditingEventId(null);
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
                    }}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage; 