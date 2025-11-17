import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { BackButton } from '../../components/common/BackButton';
import { useAuthStore } from '../../store/auth';

interface TimeSlot {
  id: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

interface AvailabilityBlock {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  recurringDays?: number[];
}

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const TeacherAvailabilityPage: React.FC = () => {
  const { user } = useAuthStore();
  const [availability, setAvailability] = useState<AvailabilityBlock[]>([]);
  const [recurringSlots, setRecurringSlots] = useState<TimeSlot[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBlock, setEditingBlock] = useState<AvailabilityBlock | null>(null);
  const [newBlock, setNewBlock] = useState<Partial<AvailabilityBlock>>({
    date: '',
    startTime: '',
    endTime: '',
    isRecurring: false,
    recurringDays: []
  });

  useEffect(() => {
    loadAvailability();
  }, []);

  const loadAvailability = async () => {
    try {
      // TODO: Replace with actual API call
      // const data = await apiService.getTeacherAvailability(user?.id);
      // setAvailability(data.blocks);
      // setRecurringSlots(data.recurringSlots);
    } catch (error) {
      console.error('Error loading availability:', error);
    }
  };

  const saveAvailability = async (block: AvailabilityBlock) => {
    try {
      // TODO: Replace with actual API call
      // await apiService.saveTeacherAvailability(user?.id, block);
      
      if (editingBlock) {
        setAvailability(prev => prev.map(b => b.id === block.id ? block : b));
      } else {
        setAvailability(prev => [...prev, block]);
      }
      setShowAddModal(false);
      setEditingBlock(null);
      setNewBlock({
        date: '',
        startTime: '',
        endTime: '',
        isRecurring: false,
        recurringDays: []
      });
    } catch (error) {
      console.error('Error saving availability:', error);
      alert('Failed to save availability');
    }
  };

  const deleteAvailability = async (id: string) => {
    if (!confirm('Are you sure you want to delete this availability block?')) return;
    
    try {
      // TODO: Replace with actual API call
      // await apiService.deleteTeacherAvailability(user?.id, id);
      setAvailability(prev => prev.filter(b => b.id !== id));
    } catch (error) {
      console.error('Error deleting availability:', error);
      alert('Failed to delete availability');
    }
  };

  const toggleDay = (day: number) => {
    setNewBlock(prev => {
      const days = prev.recurringDays || [];
      const newDays = days.includes(day)
        ? days.filter(d => d !== day)
        : [...days, day];
      return { ...prev, recurringDays: newDays };
    });
  };

  const openEditModal = (block: AvailabilityBlock) => {
    setEditingBlock(block);
    setNewBlock(block);
    setShowAddModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlock.startTime || !newBlock.endTime) {
      alert('Please fill in start and end times');
      return;
    }

    if (newBlock.isRecurring && (!newBlock.recurringDays || newBlock.recurringDays.length === 0)) {
      alert('Please select at least one day for recurring availability');
      return;
    }

    if (!newBlock.isRecurring && !newBlock.date) {
      alert('Please select a date');
      return;
    }

    const block: AvailabilityBlock = {
      id: editingBlock?.id || `block-${Date.now()}`,
      date: newBlock.date || '',
      startTime: newBlock.startTime!,
      endTime: newBlock.endTime!,
      isRecurring: newBlock.isRecurring || false,
      recurringDays: newBlock.isRecurring ? newBlock.recurringDays : undefined
    };

    saveAvailability(block);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 border-b border-gray-200 dark:border-gray-700 pb-6">
          <BackButton showHome />
          <div className="mt-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                My Availability
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Set when you're available for students to book lessons
              </p>
            </div>
            <button
              onClick={() => {
                setEditingBlock(null);
                setNewBlock({
                  date: '',
                  startTime: '',
                  endTime: '',
                  isRecurring: false,
                  recurringDays: []
                });
                setShowAddModal(true);
              }}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Availability
            </button>
          </div>
        </div>

        {/* Availability Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availability.map((block) => (
            <div
              key={block.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  {block.isRecurring ? (
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span className="font-semibold text-gray-900 dark:text-white">
                          Recurring
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {block.recurringDays?.map(day => (
                          <span
                            key={day}
                            className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded text-xs font-medium"
                          >
                            {daysOfWeek[day].slice(0, 3)}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {new Date(block.date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2 mt-2 text-sm text-gray-600 dark:text-gray-400">
                    <Clock className="h-4 w-4" />
                    <span>
                      {block.startTime} - {block.endTime}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openEditModal(block)}
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteAvailability(block.id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {availability.length === 0 && (
            <div className="col-span-full text-center py-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-base font-medium text-gray-900 dark:text-white mb-2">
                No availability set
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                Add your availability so students can book lessons with you
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Add Availability
              </button>
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {editingBlock ? 'Edit Availability' : 'Add Availability'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingBlock(null);
                      setNewBlock({
                        date: '',
                        startTime: '',
                        endTime: '',
                        isRecurring: false,
                        recurringDays: []
                      });
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Recurring Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                  <label className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                    <Calendar className="h-4 w-4 mr-2" />
                    Recurring Availability
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewBlock(prev => ({ ...prev, isRecurring: !prev.isRecurring }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      newBlock.isRecurring ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        newBlock.isRecurring ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Date or Days Selection */}
                {newBlock.isRecurring ? (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Select Days
                    </label>
                    <div className="grid grid-cols-7 gap-2">
                      {daysOfWeek.map((day, index) => (
                        <button
                          key={index}
                          type="button"
                        onClick={() => toggleDay(index)}
                        className={`p-3 border transition-colors font-medium text-sm ${
                          newBlock.recurringDays?.includes(index)
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-300'
                            : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}
                        >
                          {day.slice(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Date *
                    </label>
                    <input
                      type="date"
                      required={!newBlock.isRecurring}
                      value={newBlock.date}
                      onChange={(e) => setNewBlock(prev => ({ ...prev, date: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                )}

                {/* Time Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Start Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={newBlock.startTime}
                      onChange={(e) => setNewBlock(prev => ({ ...prev, startTime: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      End Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={newBlock.endTime}
                      onChange={(e) => setNewBlock(prev => ({ ...prev, endTime: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                {/* Submit */}
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium"
                  >
                    <Save className="h-4 w-4 inline mr-2" />
                    {editingBlock ? 'Update' : 'Save'} Availability
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingBlock(null);
                      setNewBlock({
                        date: '',
                        startTime: '',
                        endTime: '',
                        isRecurring: false,
                        recurringDays: []
                      });
                    }}
                    className="px-6 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
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

