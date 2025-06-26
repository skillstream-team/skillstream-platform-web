import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Move, 
  Eye, 
  Save, 
  X, 
  BookOpen, 
  FileText, 
  Video, 
  Image, 
  Link, 
  Download,
  Upload,
  Settings,
  Calendar,
  Clock,
  Users,
  Star,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Copy,
  Share2
} from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { apiService } from '../services/api';
import { Course, Lesson, Material } from '../types';
import { LessonEditor } from './LessonEditor';
import { CurriculumPlanner } from './CurriculumPlanner';

interface LearningObjective {
  id: string;
  title: string;
  description: string;
  type: 'knowledge' | 'skill' | 'attitude';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  completed: boolean;
}

interface CourseSection {
  id: string;
  title: string;
  description?: string;
  order: number;
  lessons: Lesson[];
  objectives: LearningObjective[];
  estimatedDuration: number; // in minutes
  isExpanded?: boolean;
}

interface CourseBuilderProps {
  courseId?: string;
  onSave?: (course: Course) => void;
  onCancel?: () => void;
}

export const CourseBuilder: React.FC<CourseBuilderProps> = ({
  courseId,
  onSave,
  onCancel
}) => {
  const { user } = useAuthStore();
  const [course, setCourse] = useState<Partial<Course>>({
    title: '',
    description: '',
    isPaid: false,
    price: 0,
    teacherId: user?.id || ''
  });
  const [sections, setSections] = useState<CourseSection[]>([]);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'builder' | 'editor' | 'planner'>('builder');
  const [showLessonEditor, setShowLessonEditor] = useState(false);
  const [showCurriculumPlanner, setShowCurriculumPlanner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    if (courseId) {
      loadCourse();
    }
  }, [courseId]);

  const loadCourse = async () => {
    if (!courseId) return;
    
    try {
      setLoading(true);
      const courseData = await apiService.getCourse(courseId);
      const lessons = await apiService.getLessons(courseId);
      
      setCourse(courseData);
      
      // Group lessons into sections
      const courseSections: CourseSection[] = [];
      const lessonGroups = groupLessonsBySection(lessons);
      
      lessonGroups.forEach((group, index) => {
        courseSections.push({
          id: `section-${index}`,
          title: group.sectionTitle || `Section ${index + 1}`,
          description: group.sectionDescription,
          order: index,
          lessons: group.lessons,
          objectives: [],
          estimatedDuration: 0,
          isExpanded: true
        });
      });
      
      setSections(courseSections);
    } catch (error) {
      console.error('Error loading course:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupLessonsBySection = (lessons: Lesson[]) => {
    // In a real app, lessons would have section information
    // For now, we'll create a simple grouping
    const groups: { sectionTitle: string; sectionDescription?: string; lessons: Lesson[] }[] = [];
    let currentGroup: Lesson[] = [];
    
    lessons.forEach((lesson, index) => {
      currentGroup.push(lesson);
      
      // Create a new section every 3 lessons or at specific breakpoints
      if ((index + 1) % 3 === 0 || index === lessons.length - 1) {
        groups.push({
          sectionTitle: `Module ${Math.floor(index / 3) + 1}`,
          sectionDescription: `Lessons ${Math.floor(index / 3) * 3 + 1} - ${index + 1}`,
          lessons: [...currentGroup]
        });
        currentGroup = [];
      }
    });
    
    return groups;
  };

  const addSection = () => {
    const newSection: CourseSection = {
      id: `section-${Date.now()}`,
      title: `New Section ${sections.length + 1}`,
      description: '',
      order: sections.length,
      lessons: [],
      objectives: [],
      estimatedDuration: 0,
      isExpanded: true
    };
    setSections(prev => [...prev, newSection]);
    setSelectedSection(newSection.id);
  };

  const updateSection = (sectionId: string, updates: Partial<CourseSection>) => {
    setSections(prev => prev.map(section => 
      section.id === sectionId ? { ...section, ...updates } : section
    ));
  };

  const deleteSection = (sectionId: string) => {
    setSections(prev => prev.filter(section => section.id !== sectionId));
    if (selectedSection === sectionId) {
      setSelectedSection(null);
    }
  };

  const addLesson = (sectionId: string) => {
    const newLesson: Lesson = {
      id: `lesson-${Date.now()}`,
      title: 'New Lesson',
      content: '',
      scheduledAt: new Date().toISOString(),
      courseId: courseId || '',
      materials: [],
      attendance: []
    };

    setSections(prev => prev.map(section => 
      section.id === sectionId 
        ? { ...section, lessons: [...section.lessons, newLesson] }
        : section
    ));

    setSelectedLesson(newLesson.id);
    setShowLessonEditor(true);
  };

  const updateLesson = (sectionId: string, lessonId: string, updates: Partial<Lesson>) => {
    setSections(prev => prev.map(section => 
      section.id === sectionId 
        ? {
            ...section,
            lessons: section.lessons.map(lesson => 
              lesson.id === lessonId ? { ...lesson, ...updates } : lesson
            )
          }
        : section
    ));
  };

  const deleteLesson = (sectionId: string, lessonId: string) => {
    setSections(prev => prev.map(section => 
      section.id === sectionId 
        ? { ...section, lessons: section.lessons.filter(lesson => lesson.id !== lessonId) }
        : section
    ));
    
    if (selectedLesson === lessonId) {
      setSelectedLesson(null);
      setShowLessonEditor(false);
    }
  };

  const moveSection = (fromIndex: number, toIndex: number) => {
    const newSections = [...sections];
    const [movedSection] = newSections.splice(fromIndex, 1);
    newSections.splice(toIndex, 0, movedSection);
    
    // Update order
    newSections.forEach((section, index) => {
      section.order = index;
    });
    
    setSections(newSections);
  };

  const moveLesson = (fromSectionId: string, toSectionId: string, lessonId: string) => {
    const lesson = sections
      .find(section => section.id === fromSectionId)
      ?.lessons.find(lesson => lesson.id === lessonId);
    
    if (!lesson) return;

    // Remove from source section
    setSections(prev => prev.map(section => 
      section.id === fromSectionId 
        ? { ...section, lessons: section.lessons.filter(l => l.id !== lessonId) }
        : section
    ));

    // Add to target section
    setSections(prev => prev.map(section => 
      section.id === toSectionId 
        ? { ...section, lessons: [...section.lessons, lesson] }
        : section
    ));
  };

  const saveCourse = async () => {
    try {
      setLoading(true);
      
      let savedCourse: Course;
      
      if (courseId) {
        savedCourse = await apiService.updateCourse(courseId, course);
      } else {
        savedCourse = await apiService.createCourse(course as any);
      }

      // Save sections and lessons
      for (const section of sections) {
        for (const lesson of section.lessons) {
          if (lesson.id.startsWith('lesson-')) {
            // New lesson
            await apiService.createLesson({
              ...lesson,
              courseId: savedCourse.id
            });
          } else {
            // Existing lesson
            await apiService.updateLesson(lesson.id, lesson);
          }
        }
      }

      onSave?.(savedCourse);
    } catch (error) {
      console.error('Error saving course:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLessonIcon = (lesson: Lesson) => {
    if (lesson.videoUrl) return <Video className="h-4 w-4" />;
    if (lesson.materials.length > 0) return <FileText className="h-4 w-4" />;
    return <BookOpen className="h-4 w-4" />;
  };

  const getLessonStatus = (lesson: Lesson) => {
    // In a real app, this would check completion status
    return 'draft';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {courseId ? 'Edit Course' : 'Create New Course'}
              </h1>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className={`flex items-center px-3 py-1 rounded-md text-sm ${
                    previewMode 
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </button>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowCurriculumPlanner(true)}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Curriculum Planner
              </button>
              <button
                onClick={saveCourse}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : 'Save Course'}
              </button>
              <button
                onClick={onCancel}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Course Info */}
          <div className="pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Course Title
                </label>
                <input
                  type="text"
                  value={course.title}
                  onChange={(e) => setCourse(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter course title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Price
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={course.price || 0}
                    onChange={(e) => setCourse(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={course.isPaid}
                      onChange={(e) => setCourse(prev => ({ ...prev, isPaid: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Paid Course</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={course.description}
                onChange={(e) => setCourse(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Enter course description"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Course Structure */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Course Structure</h2>
                  <button
                    onClick={addSection}
                    className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Section
                  </button>
                </div>
              </div>

              <div className="p-6">
                {sections.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No sections yet</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      Start building your course by adding sections and lessons
                    </p>
                    <button
                      onClick={addSection}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Section
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sections.map((section, index) => (
                      <div key={section.id} className="border border-gray-200 dark:border-gray-600 rounded-lg">
                        {/* Section Header */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700">
                          <div className="flex items-center space-x-3">
                            <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                            <button
                              onClick={() => updateSection(section.id, { isExpanded: !section.isExpanded })}
                              className="flex items-center space-x-2 text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                            >
                              {section.isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                              <span className="font-medium">{section.title}</span>
                            </button>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              {section.lessons.length} lessons
                            </span>
                            <button
                              onClick={() => addLesson(section.id)}
                              className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setSelectedSection(section.id)}
                              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteSection(section.id)}
                              className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Section Content */}
                        {section.isExpanded && (
                          <div className="p-4">
                            {section.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                                {section.description}
                              </p>
                            )}
                            
                            <div className="space-y-2">
                              {section.lessons.map((lesson, lessonIndex) => (
                                <div
                                  key={lesson.id}
                                  className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                  <div className="flex items-center space-x-3">
                                    <GripVertical className="h-3 w-3 text-gray-400 cursor-move" />
                                    {getLessonIcon(lesson)}
                                    <div>
                                      <div className="font-medium text-gray-900 dark:text-white">
                                        {lesson.title}
                                      </div>
                                      <div className="text-sm text-gray-600 dark:text-gray-300">
                                        {lesson.content.substring(0, 50)}...
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                      getLessonStatus(lesson) === 'draft' 
                                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    }`}>
                                      {getLessonStatus(lesson)}
                                    </span>
                                    <button
                                      onClick={() => {
                                        setSelectedLesson(lesson.id);
                                        setShowLessonEditor(true);
                                      }}
                                      className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                                    >
                                      <Edit3 className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => deleteLesson(section.id, lesson.id)}
                                      className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Course Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Course Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Total Sections</span>
                  <span className="font-medium text-gray-900 dark:text-white">{sections.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Total Lessons</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {sections.reduce((total, section) => total + section.lessons.length, 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Total Duration</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {sections.reduce((total, section) => total + section.lessons.length * 30, 0)} min
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-300">Course Type</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    course.isPaid 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  }`}>
                    {course.isPaid ? 'Paid' : 'Free'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setShowCurriculumPlanner(true)}
                  className="w-full flex items-center px-3 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Calendar className="h-4 w-4 mr-3" />
                  Curriculum Planner
                </button>
                <button
                  onClick={() => setShowLessonEditor(true)}
                  className="w-full flex items-center px-3 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Edit3 className="h-4 w-4 mr-3" />
                  Create Lesson
                </button>
                <button className="w-full flex items-center px-3 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <Upload className="h-4 w-4 mr-3" />
                  Upload Materials
                </button>
                <button className="w-full flex items-center px-3 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <Settings className="h-4 w-4 mr-3" />
                  Course Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showLessonEditor && (
        <LessonEditor
          lessonId={selectedLesson || undefined}
          courseId={courseId || ''}
          onClose={() => {
            setShowLessonEditor(false);
            setSelectedLesson(null);
          }}
          onSave={(savedLesson) => {
            // Update the lesson in the appropriate section
            setSections(prev => prev.map(section => ({
              ...section,
              lessons: section.lessons.map(lesson => 
                lesson.id === savedLesson.id ? savedLesson : lesson
              )
            })));
            setShowLessonEditor(false);
            setSelectedLesson(null);
          }}
        />
      )}

      {showCurriculumPlanner && (
        <CurriculumPlanner
          course={course}
          sections={sections}
          onClose={() => setShowCurriculumPlanner(false)}
          onSave={(updatedSections) => {
            setSections(updatedSections);
            setShowCurriculumPlanner(false);
          }}
        />
      )}
    </div>
  );
}; 