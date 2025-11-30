import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Check, X, BookOpen, Star, Users } from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { getAvailableSlots, getMyBookings, bookLessonSlot, cancelBooking as cancelBookingApi } from '../../services/api';

interface AvailableSlot {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherAvatar?: string;
  teacherRating?: number;
  teacherReviewCount?: number;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  price?: number;
  isPaid: boolean;
  subject: string;
  lessonType: 'live' | 'recorded';
  availableSpots: number;
  totalSpots: number;
}

interface Booking {
  id: string;
  slotId: string;
  teacherName: string;
  scheduledAt: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  bookedAt: string;
}

export const StudentBookingPage: React.FC = () => {
  const { user } = useAuthStore();
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    loadAvailableSlots();
    loadMyBookings();
  }, [selectedDate, selectedSubject, selectedTeacher]);

  const loadAvailableSlots = async () => {
    try {
      setLoading(true);
      const slots = await getAvailableSlots({
        date: selectedDate,
        subject: selectedSubject,
        teacherId: selectedTeacher
      });
      setAvailableSlots(slots as AvailableSlot[]);
    } catch (error) {
      console.error('Error loading slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMyBookings = async () => {
    try {
      if (!user?.id) {
        setMyBookings([]);
        return;
      }
      const bookings = await getMyBookings(user.id);
      setMyBookings(bookings as Booking[]);
    } catch (error) {
      console.error('Error loading bookings:', error);
    }
  };

  const handleBookSlot = (slot: AvailableSlot) => {
    setSelectedSlot(slot);
    setShowBookingModal(true);
  };

  const confirmBooking = async () => {
    if (!selectedSlot || !user?.id) return;
    
    try {
      const booking = await bookLessonSlot(selectedSlot.id, user.id);
      setMyBookings(prev => [...prev, booking as Booking]);
      setShowBookingModal(false);
      setSelectedSlot(null);
      loadAvailableSlots();
    } catch (error) {
      console.error('Error booking slot:', error);
      alert('Failed to book lesson. Please try again.');
    }
  };

  const cancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    
    try {
      await cancelBookingApi(bookingId);
      setMyBookings(prev => prev.filter(b => b.id !== bookingId));
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Failed to cancel booking.');
    }
  };

  const formatTime = (time: string) => {
    try {
      if (!time) return '';
      const [hours, minutes] = time.split(':');
      const date = new Date();
      date.setHours(parseInt(hours) || 0, parseInt(minutes) || 0);
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return '';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      if (date.toDateString() === today.toDateString()) {
        return 'Today';
      } else if (date.toDateString() === tomorrow.toDateString()) {
        return 'Tomorrow';
      } else {
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      }
    } catch {
      return '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center max-w-3xl mx-auto mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Book a Lesson with Expert Teachers
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Find available lessons, book your slot, and start learning
            </p>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <BookOpen className="h-4 w-4 inline mr-1" />
                Subject
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Subjects</option>
                <option value="Physics">Physics</option>
                <option value="Math">Mathematics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Biology">Biology</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <User className="h-4 w-4 inline mr-1" />
                Teacher
              </label>
              <select
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Teachers</option>
                {/* TODO: Load teachers from API */}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Available Slots */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Available Lessons
              </h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}
                >
                  <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                    <div className="bg-current"></div>
                    <div className="bg-current"></div>
                    <div className="bg-current"></div>
                    <div className="bg-current"></div>
                  </div>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}
                >
                  <div className="w-4 h-4 flex flex-col gap-0.5">
                    <div className="h-0.5 bg-current"></div>
                    <div className="h-0.5 bg-current"></div>
                    <div className="h-0.5 bg-current"></div>
                  </div>
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-12 text-center">
                <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No lessons available
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try selecting a different date or subject
                </p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors overflow-hidden"
                  >
                    {/* Teacher Header */}
                    <div className="bg-blue-50 dark:bg-blue-900/10 px-6 py-4 border-b border-blue-100 dark:border-blue-800">
                      <div className="flex items-center space-x-3">
                        {slot.teacherAvatar ? (
                          <img
                            src={slot.teacherAvatar}
                            alt={slot.teacherName}
                            className="w-12 h-12 rounded-full"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                            <User className="h-6 w-6 text-white" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {slot.teacherName}
                          </h3>
                          {slot.teacherRating && (
                            <div className="flex items-center space-x-1 text-sm">
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                              <span className="text-gray-600 dark:text-gray-400">
                                {slot.teacherRating.toFixed(1)} ({slot.teacherReviewCount} reviews)
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      {/* Lesson Info */}
                      <div className="mb-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-medium">
                            {slot.subject}
                          </span>
                          {slot.lessonType === 'live' && (
                            <span className="px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs font-medium">
                              Live
                            </span>
                          )}
                        </div>
                        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(slot.date)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4" />
                            <span>{formatTime(slot.startTime)} - {formatTime(slot.endTime)} ({slot.duration} min)</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4" />
                            <span>{slot.availableSpots} of {slot.totalSpots} spots available</span>
                          </div>
                        </div>
                      </div>

                      {/* Price and Book Button */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div>
                          {slot.isPaid && slot.price ? (
                            <span className="text-xl font-semibold text-gray-900 dark:text-white">
                              ${slot.price}
                            </span>
                          ) : (
                            <span className="text-xl font-semibold text-green-600 dark:text-green-400">
                              Free
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleBookSlot(slot)}
                          disabled={slot.availableSpots === 0}
                          className="px-5 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {availableSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        {slot.teacherAvatar ? (
                          <img
                            src={slot.teacherAvatar}
                            alt={slot.teacherName}
                            className="w-16 h-16 rounded-full"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center">
                            <User className="h-8 w-8 text-white" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {slot.teacherName}
                            </h3>
                            {slot.teacherRating && (
                              <div className="flex items-center space-x-1">
                                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {slot.teacherRating.toFixed(1)}
                                </span>
                              </div>
                            )}
                            <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-medium">
                              {slot.subject}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                            <span className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(slot.date)}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{formatTime(slot.startTime)} - {formatTime(slot.endTime)}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Users className="h-4 w-4" />
                              <span>{slot.availableSpots} spots left</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          {slot.isPaid && slot.price ? (
                            <span className="text-xl font-semibold text-gray-900 dark:text-white">
                              ${slot.price}
                            </span>
                          ) : (
                            <span className="text-xl font-semibold text-green-600 dark:text-green-400">
                              Free
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleBookSlot(slot)}
                          disabled={slot.availableSpots === 0}
                          className="px-5 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Book
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* My Bookings Sidebar */}
          <div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                My Bookings
              </h2>
              {myBookings.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No bookings yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-1 text-xs font-medium ${
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300' :
                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300' :
                          'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                        }`}>
                          {booking.status}
                        </span>
                        {booking.status !== 'cancelled' && (
                          <button
                            onClick={() => cancelBooking(booking.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <div className="font-medium text-gray-900 dark:text-white mb-1">
                        {booking.teacherName}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(booking.scheduledAt)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Booking Confirmation Modal */}
        {showBookingModal && selectedSlot && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Confirm Booking
              </h3>
              <div className="space-y-4 mb-6">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Teacher</div>
                  <div className="font-semibold text-gray-900 dark:text-white">{selectedSlot.teacherName}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Date & Time</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {formatDate(selectedSlot.date)} • {formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Duration</div>
                  <div className="font-semibold text-gray-900 dark:text-white">{selectedSlot.duration} minutes</div>
                </div>
                {selectedSlot.isPaid && selectedSlot.price && (
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Price</div>
                    <div className="font-semibold text-green-600 dark:text-green-400">${selectedSlot.price}</div>
                  </div>
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={confirmBooking}
                  className="flex-1 px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2"
                >
                  <Check className="h-4 w-4" />
                  <span>Confirm Booking</span>
                </button>
                <button
                  onClick={() => {
                    setShowBookingModal(false);
                    setSelectedSlot(null);
                  }}
                  className="px-6 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
