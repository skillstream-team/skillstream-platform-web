import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  Users, 
  Video, 
  BookOpen, 
  Calendar, 
  DollarSign,
  Link as LinkIcon,
  Copy,
  Check,
  Zap,
  FileText,
  Play,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useAuthStore } from '../../store/auth';

interface LessonTemplate {
  id: string;
  name: string;
  subject: string;
  duration: number;
  description: string;
  icon: React.ReactNode;
}

const lessonTemplates: LessonTemplate[] = [
  {
    id: 'physics-basics',
    name: 'Physics Problem Solving',
    subject: 'Physics',
    duration: 60,
    description: 'Interactive problem-solving session',
    icon: <Zap className="h-6 w-6" />
  },
  {
    id: 'math-tutoring',
    name: 'One-on-One Math Help',
    subject: 'Mathematics',
    duration: 45,
    description: 'Personalized math tutoring',
    icon: <BookOpen className="h-6 w-6" />
  },
  {
    id: 'group-study',
    name: 'Group Study Session',
    subject: 'General',
    duration: 90,
    description: 'Collaborative learning with multiple students',
    icon: <Users className="h-6 w-6" />
  },
  {
    id: 'exam-prep',
    name: 'Exam Preparation',
    subject: 'General',
    duration: 120,
    description: 'Focused exam review and practice',
    icon: <FileText className="h-6 w-6" />
  }
];

export const QuickLessonPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [lessonData, setLessonData] = useState({
    title: '',
    description: '',
    subject: '',
    scheduledDate: '',
    scheduledTime: '',
    duration: 60,
    maxStudents: 10,
    isPaid: false,
    price: 0,
    lessonType: 'live' as 'live' | 'recorded',
    materials: [] as string[]
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createdLesson, setCreatedLesson] = useState<{ id: string; joinLink: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleTemplateSelect = (template: LessonTemplate) => {
    setSelectedTemplate(template.id);
    setLessonData(prev => ({
      ...prev,
      title: template.name,
      description: template.description,
      subject: template.subject,
      duration: template.duration
    }));
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      // TODO: Replace with actual API call
      // const lesson = await apiService.createQuickLesson({
      //   ...lessonData,
      //   teacherId: user?.id,
      //   scheduledAt: new Date(`${lessonData.scheduledDate}T${lessonData.scheduledTime}`).toISOString()
      // });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockLesson = {
        id: `lesson-${Date.now()}`,
        joinLink: `${window.location.origin}/lessons/join/${Date.now()}`
      };

      setCreatedLesson(mockLesson);
    } catch (error) {
      console.error('Error creating lesson:', error);
      alert('Failed to create lesson. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const copyJoinLink = () => {
    if (createdLesson) {
      navigator.clipboard.writeText(createdLesson.joinLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const startLesson = () => {
    if (createdLesson) {
      navigate(`/lessons/${createdLesson.id}/live`);
    }
  };

  if (createdLesson) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-600 flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                Lesson Created Successfully
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Your lesson is ready. Share the link with your students or start now.
              </p>
            </div>

            <div className="space-y-6">
              {/* Join Link */}
              <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 p-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Share this link with students:
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={createdLesson.joinLink}
                    readOnly
                    className="flex-1 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  />
                  <button
                    onClick={copyJoinLink}
                    className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={startLesson}
                  className="flex items-center justify-center px-6 py-3 bg-green-600 text-white hover:bg-green-700 transition-colors font-medium"
                >
                  <Play className="h-5 w-5 mr-2" />
                  Start Lesson Now
                </button>
                <button
                  onClick={() => {
                    setCreatedLesson(null);
                    setLessonData({
                      title: '',
                      description: '',
                      subject: '',
                      scheduledDate: '',
                      scheduledTime: '',
                      duration: 60,
                      maxStudents: 10,
                      isPaid: false,
                      price: 0,
                      lessonType: 'live',
                      materials: []
                    });
                    setSelectedTemplate(null);
                  }}
                  className="flex items-center justify-center px-6 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  Create Another Lesson
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full mb-6">
              <Video className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Create Your Lesson in Minutes
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
              Set up an extra lesson, invite students, and start teaching. Perfect for one-on-one tutoring, group sessions, or exam prep.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Templates Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 sticky top-8">
              <div className="flex items-center space-x-2 mb-6">
                <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Quick Start Templates
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Choose a template to get started quickly
              </p>
              <div className="space-y-3">
                {lessonTemplates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className={`w-full p-4 border text-left transition-all ${
                      selectedTemplate === template.id
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/10 shadow-sm'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 ${
                        selectedTemplate === template.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}>
                        {template.icon}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 dark:text-white text-sm">
                          {template.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {template.duration} min
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleCreateLesson} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-8">
              <div className="space-y-6">
                {/* Basic Info */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Lesson Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={lessonData.title}
                    onChange={(e) => setLessonData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., Physics Problem Solving Session"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    What will students learn?
                  </label>
                  <textarea
                    value={lessonData.description}
                    onChange={(e) => setLessonData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Describe what you'll cover in this lesson..."
                  />
                </div>

                {/* Schedule */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      <Calendar className="h-4 w-4 inline mr-1" />
                      Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={lessonData.scheduledDate}
                      onChange={(e) => setLessonData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      <Clock className="h-4 w-4 inline mr-1" />
                      Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={lessonData.scheduledTime}
                      onChange={(e) => setLessonData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Duration (min) *
                    </label>
                    <input
                      type="number"
                      required
                      min={15}
                      max={240}
                      step={15}
                      value={lessonData.duration}
                      onChange={(e) => setLessonData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                {/* Capacity */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    <Users className="h-4 w-4 inline mr-1" />
                    Maximum Students
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={lessonData.maxStudents}
                    onChange={(e) => setLessonData(prev => ({ ...prev, maxStudents: parseInt(e.target.value) }))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Set to 1 for one-on-one tutoring
                  </p>
                </div>

                {/* Pricing */}
                <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <label className="flex items-center text-sm font-semibold text-gray-900 dark:text-white">
                      <DollarSign className="h-4 w-4 mr-1" />
                      Paid Lesson
                    </label>
                    <button
                      type="button"
                      onClick={() => setLessonData(prev => ({ ...prev, isPaid: !prev.isPaid }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        lessonData.isPaid ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          lessonData.isPaid ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  {lessonData.isPaid && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Price ($)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={lessonData.price}
                        onChange={(e) => setLessonData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  )}
                </div>

                {/* Submit */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="w-full px-6 py-4 bg-blue-600 text-white hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {isCreating ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Creating Lesson...</span>
                      </>
                    ) : (
                      <>
                        <Video className="h-5 w-5" />
                        <span>Create & Share Lesson</span>
                        <ArrowRight className="h-5 w-5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
