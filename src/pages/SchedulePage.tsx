import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  Video, 
  Users,
  Plus,
  ChevronLeft,
  ChevronRight,
  Download,
  Bell,
  AlertCircle
} from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { getMyCalendarEvents } from '../services/api';
import { BottomSheet } from '../components/mobile/BottomSheet';
import { SwipeableTabs } from '../components/mobile/SwipeableTabs';

interface ScheduleEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  type: 'live_class' | 'deadline' | 'assignment_due' | 'quiz_due' | 'custom';
  description?: string;
  location?: string;
  joinLink?: string;
}

export const SchedulePage: React.FC = () => {
  const { user } = useAuthStore();
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'list'>('list');
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await getMyCalendarEvents({});
      setEvents(data);
    } catch (error) {
      console.error('Error loading events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getEventsForDate = (date: Date | null) => {
    if (!date) return [];
    return events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const getUpcomingEvents = () => {
    const now = new Date();
    return events
      .filter(event => new Date(event.startTime) > now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 10);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const getTimeUntil = (dateString: string) => {
    const now = new Date();
    const eventDate = new Date(dateString);
    const diff = eventDate.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return 'Now';
    }
  };

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'live_class': '#00B5AD',
      'deadline': '#6F73D2',
      'assignment_due': '#9A8CFF',
      'quiz_due': '#F59E0B',
      'custom': '#6F73D2'
    };
    return colors[type] || '#6F73D2';
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'live_class':
        return Video;
      case 'deadline':
      case 'assignment_due':
        return AlertCircle;
      case 'quiz_due':
        return Calendar;
      default:
        return Clock;
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const upcomingEvents = getUpcomingEvents();
  const days = getDaysInMonth(currentDate);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F4F7FA' }}>
        <div 
          className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent"
          style={{ borderColor: '#00B5AD' }}
        ></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F4F7FA' }}>
      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold mb-2" style={{ color: '#0B1E3F' }}>
              Schedule
            </h1>
            <p className="text-base" style={{ color: '#6F73D2' }}>
              Manage your upcoming sessions and deadlines
            </p>
          </div>
          <button
            onClick={() => setShowAddEvent(true)}
            className="px-4 lg:px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300 active:scale-95"
            style={{ 
              backgroundColor: '#00B5AD',
              boxShadow: '0 4px 14px rgba(0, 181, 173, 0.3)'
            }}
          >
            <Plus className="h-5 w-5 inline mr-2" />
            <span className="hidden sm:inline">Add Event</span>
          </button>
        </div>

        {/* View Mode Toggle - Mobile */}
        <div className="lg:hidden mb-4">
          <SwipeableTabs
            tabs={[
              { id: 'list', label: 'Upcoming', content: null },
              { id: 'month', label: 'Month', content: null },
              { id: 'week', label: 'Week', content: null }
            ]}
            defaultTab={viewMode}
            onTabChange={(tab) => setViewMode(tab as 'month' | 'week' | 'list')}
          />
        </div>

        {/* View Mode Toggle - Desktop */}
        <div className="hidden lg:flex space-x-2 mb-6">
          {[
            { id: 'list', label: 'Upcoming' },
            { id: 'month', label: 'Month View' },
            { id: 'week', label: 'Week View' }
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setViewMode(mode.id as 'month' | 'week' | 'list')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                viewMode === mode.id ? 'scale-105' : ''
              }`}
              style={{
                backgroundColor: viewMode === mode.id ? '#00B5AD' : 'rgba(0, 181, 173, 0.1)',
                color: viewMode === mode.id ? 'white' : '#0B1E3F',
                boxShadow: viewMode === mode.id ? '0 4px 14px rgba(0, 181, 173, 0.3)' : 'none'
              }}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map((event) => {
              const Icon = getEventTypeIcon(event.type);
              const color = getEventTypeColor(event.type);
              const isUpcoming = new Date(event.startTime) > new Date();
              const timeUntil = isUpcoming ? getTimeUntil(event.startTime) : null;
              
              return (
                <div
                  key={event.id}
                  className="p-5 lg:p-6 rounded-2xl border-2 transition-all duration-200 active:scale-[0.98]"
                  style={{
                    backgroundColor: 'white',
                    borderColor: isUpcoming && timeUntil === 'Now' ? color : '#E5E7EB',
                    borderLeftWidth: '4px',
                    borderLeftColor: color
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: `${color}15` }}
                        >
                          <Icon className="h-5 w-5" style={{ color }} />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold mb-1" style={{ color: '#0B1E3F' }}>
                            {event.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 text-sm" style={{ color: '#6F73D2' }}>
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(event.startTime).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{formatTime(event.startTime)} - {formatTime(event.endTime)}</span>
                            </div>
                            {event.location && (
                              <div className="flex items-center space-x-1">
                                <Users className="h-4 w-4" />
                                <span>{event.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {event.description && (
                        <p className="text-sm mb-3" style={{ color: '#6F73D2' }}>
                          {event.description}
                        </p>
                      )}
                      {timeUntil && isUpcoming && (
                        <div className="flex items-center space-x-2">
                          <div 
                            className="px-3 py-1.5 rounded-full text-xs font-bold"
                            style={{ 
                              backgroundColor: timeUntil === 'Now' ? `${color}15` : 'rgba(0, 181, 173, 0.1)',
                              color: timeUntil === 'Now' ? color : '#00B5AD'
                            }}
                          >
                            {timeUntil === 'Now' ? 'Starting Now' : `In ${timeUntil}`}
                          </div>
                        </div>
                      )}
                    </div>
                    {event.joinLink && (
                      <a
                        href={event.joinLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-4 px-5 py-3 rounded-xl font-semibold text-white transition-all duration-300 active:scale-95 flex-shrink-0"
                        style={{ 
                          backgroundColor: '#00B5AD',
                          boxShadow: '0 4px 14px rgba(0, 181, 173, 0.3)'
                        }}
                      >
                        Join
                      </a>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-16 rounded-2xl border-2" style={{ backgroundColor: 'white', borderColor: '#E5E7EB' }}>
              <Calendar className="h-16 w-16 mx-auto mb-4" style={{ color: '#6F73D2', opacity: 0.5 }} />
              <p className="text-xl font-bold mb-2" style={{ color: '#0B1E3F' }}>No upcoming sessions</p>
              <p className="text-sm mb-6" style={{ color: '#6F73D2' }}>Your scheduled sessions will appear here</p>
              <button
                onClick={() => setShowAddEvent(true)}
                className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold text-white"
                style={{ 
                  backgroundColor: '#00B5AD',
                  boxShadow: '0 4px 14px rgba(0, 181, 173, 0.3)'
                }}
              >
                <Plus className="h-5 w-5" />
                <span>Add Event</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Month View */}
      {viewMode === 'month' && (
        <div 
          className="rounded-2xl border-2 p-4 lg:p-6"
          style={{
            backgroundColor: 'white',
            borderColor: '#E5E7EB'
          }}
        >
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 rounded-xl transition-all duration-200 active:scale-95"
              style={{ backgroundColor: 'rgba(0, 181, 173, 0.1)' }}
            >
              <ChevronLeft className="h-5 w-5" style={{ color: '#00B5AD' }} />
            </button>
            <h2 className="text-xl font-bold" style={{ color: '#0B1E3F' }}>
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 rounded-xl transition-all duration-200 active:scale-95"
              style={{ backgroundColor: 'rgba(0, 181, 173, 0.1)' }}
            >
              <ChevronRight className="h-5 w-5" style={{ color: '#00B5AD' }} />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Day Headers */}
            {dayNames.map(day => (
              <div key={day} className="text-center py-2 text-sm font-semibold" style={{ color: '#6F73D2' }}>
                {day}
              </div>
            ))}
            
            {/* Calendar Days */}
            {days.map((date, index) => {
              const dayEvents = getEventsForDate(date);
              const isToday = date && date.toDateString() === new Date().toDateString();
              const isSelected = date && date.toDateString() === selectedDate.toDateString();
              
              return (
                <button
                  key={index}
                  onClick={() => date && setSelectedDate(date)}
                  className={`aspect-square p-2 rounded-xl transition-all duration-200 ${
                    !date ? 'cursor-default' : 'active:scale-95'
                  }`}
                  style={{
                    backgroundColor: isSelected 
                      ? 'rgba(0, 181, 173, 0.1)' 
                      : isToday 
                        ? 'rgba(0, 181, 173, 0.05)' 
                        : 'transparent',
                    border: isToday ? '2px solid #00B5AD' : '2px solid transparent'
                  }}
                >
                  {date && (
                    <>
                      <div 
                        className={`text-sm font-semibold mb-1 ${
                          isSelected || isToday ? '' : ''
                        }`}
                        style={{ 
                          color: isSelected || isToday ? '#00B5AD' : '#0B1E3F'
                        }}
                      >
                        {date.getDate()}
                      </div>
                      {dayEvents.length > 0 && (
                        <div className="space-y-1">
                          {dayEvents.slice(0, 2).map(event => (
                            <div
                              key={event.id}
                              className="h-1 rounded-full"
                              style={{ backgroundColor: getEventTypeColor(event.type) }}
                            />
                          ))}
                          {dayEvents.length > 2 && (
                            <div className="text-xs font-bold" style={{ color: '#6F73D2' }}>
                              +{dayEvents.length - 2}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Week View - Simplified */}
      {viewMode === 'week' && (
        <div 
          className="rounded-2xl border-2 p-4 lg:p-6"
          style={{
            backgroundColor: 'white',
            borderColor: '#E5E7EB'
          }}
        >
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 mx-auto mb-4" style={{ color: '#6F73D2', opacity: 0.5 }} />
            <p className="text-lg font-bold mb-2" style={{ color: '#0B1E3F' }}>Week View</p>
            <p className="text-sm" style={{ color: '#6F73D2' }}>Coming soon</p>
          </div>
        </div>
      )}

      {/* Sticky Add to Calendar Button - Mobile */}
      <div className="lg:hidden fixed bottom-20 right-4 z-40">
        <button
          onClick={() => {
            // Export calendar
            const icsContent = events.map(event => {
              const start = new Date(event.startTime).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
              const end = new Date(event.endTime).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
              return `BEGIN:VEVENT\nDTSTART:${start}\nDTEND:${end}\nSUMMARY:${event.title}\nEND:VEVENT`;
            }).join('\n');
            
            const blob = new Blob([`BEGIN:VCALENDAR\nVERSION:2.0\n${icsContent}\nEND:VCALENDAR`], { type: 'text/calendar' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'skillstream-calendar.ics';
            a.click();
          }}
          className="w-14 h-14 rounded-full flex items-center justify-center text-white transition-all duration-300 active:scale-95 shadow-lg"
          style={{ 
            backgroundColor: '#00B5AD',
            boxShadow: '0 10px 30px rgba(0, 181, 173, 0.4)'
          }}
        >
          <Download className="h-6 w-6" />
        </button>
      </div>

      {/* Add Event Bottom Sheet */}
      <BottomSheet
        isOpen={showAddEvent}
        onClose={() => setShowAddEvent(false)}
        title="Add Event"
        maxHeight="80vh"
      >
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#0B1E3F' }}>
              Event Title
            </label>
            <input
              type="text"
              placeholder="Enter event title"
              className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-200"
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
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#0B1E3F' }}>
                Start Time
              </label>
              <input
                type="datetime-local"
                className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-200"
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
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#0B1E3F' }}>
                End Time
              </label>
              <input
                type="datetime-local"
                className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none transition-all duration-200"
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

          <div className="flex space-x-3 pt-4 border-t" style={{ borderColor: '#E5E7EB' }}>
            <button
              onClick={() => setShowAddEvent(false)}
              className="flex-1 px-6 py-3 rounded-xl font-semibold border-2 transition-all duration-200"
              style={{ 
                borderColor: '#E5E7EB',
                color: '#0B1E3F',
                backgroundColor: 'white'
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                // Handle add event
                setShowAddEvent(false);
              }}
              className="flex-1 px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300"
              style={{ 
                backgroundColor: '#00B5AD',
                boxShadow: '0 4px 14px rgba(0, 181, 173, 0.3)'
              }}
            >
              Add Event
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
};

