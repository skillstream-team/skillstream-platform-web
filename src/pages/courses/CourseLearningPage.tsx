import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Course, Lesson, Material } from '../../types';
import { BackButton } from '../../components/common/BackButton';
import { apiService } from '../../services/api';
import { Bookmark, Share2, Settings, Video, Check, FileText, Download, ArrowLeft, ArrowRight, List, X, ChevronDown } from 'lucide-react';
import { BottomSheet } from '../../components/mobile/BottomSheet';
import { EnhancedVideoPlayer } from '../../components/video/EnhancedVideoPlayer';
import { NotesAndBookmarks } from '../../components/learning/NotesAndBookmarks';
import { LessonQandA } from '../../components/learning/LessonQandA';

export const CourseLearningPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showLessonList, setShowLessonList] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [curriculum, setCurriculum] = useState<any[]>([]);
  const [expandedModules, setExpandedModules] = useState<number[]>([]);

  useEffect(() => {
    if (!id) return;
    async function loadData() {
      setIsLoading(true);
      try {
        const courseData = await apiService.getCourseDetails(Number(id));
        setCourse(courseData);
        
        // Get curriculum structure
        const curriculumData = (courseData as any)?.curriculum || [];
        setCurriculum(curriculumData);
        
        // Flatten lessons from curriculum
        const allLessons: Lesson[] = [];
        curriculumData.forEach((module: any) => {
          if (module.lessons && Array.isArray(module.lessons)) {
            allLessons.push(...module.lessons);
          }
        });
        
        setLessons(allLessons);
        setMaterials(courseData.materials || []);
        
        // Set first lesson as current
        if (allLessons.length > 0) {
          setCurrentLesson(allLessons[0]);
          // Expand first module
          if (curriculumData.length > 0) {
            setExpandedModules([0]);
          }
        }
      } catch (error) {
        console.error('Error loading course:', error);
        setCourse(null);
        setLessons([]);
        setMaterials([]);
        setCurrentLesson(null);
        setCurriculum([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleLessonClick = (lesson: Lesson) => {
    setCurrentLesson(lesson);
    setCurrentTime(0);
    // Close mobile lesson list
    setShowLessonList(false);
  };

  const toggleModule = (moduleIndex: number) => {
    setExpandedModules(prev =>
      prev.includes(moduleIndex)
        ? prev.filter(i => i !== moduleIndex)
        : [...prev, moduleIndex]
    );
  };


  const handleCompleteLesson = () => {
    if (currentLesson && !completedLessons.includes(currentLesson.id)) {
      setCompletedLessons([...completedLessons, currentLesson.id]);
    }
  };

  const getProgressPercentage = () => {
    if (lessons.length === 0) return 0;
    return Math.round((completedLessons.length / lessons.length) * 100);
  };

  const getNextLesson = () => {
    if (!currentLesson) return null;
    const currentIndex = lessons.findIndex(l => l.id === currentLesson.id);
    return currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;
  };

  const getPreviousLesson = () => {
    if (!currentLesson) return null;
    const currentIndex = lessons.findIndex(l => l.id === currentLesson.id);
    return currentIndex > 0 ? lessons[currentIndex - 1] : null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12" style={{ backgroundColor: '#F4F7FA' }}>
        <h3 className="text-lg font-bold mb-2" style={{ color: '#0B1E3F' }}>Course not found</h3>
        <p style={{ color: '#6F73D2' }}>The course you're looking for doesn't exist.</p>
      </div>
    );
  }

  const getModuleProgress = (module: any) => {
    if (!module.lessons || module.lessons.length === 0) return 0;
    const completed = module.lessons.filter((l: Lesson) => completedLessons.includes(l.id)).length;
    return Math.round((completed / module.lessons.length) * 100);
  };

  const getTotalProgress = () => {
    if (lessons.length === 0) return 0;
    return Math.round((completedLessons.length / lessons.length) * 100);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F4F7FA' }}>
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-40 backdrop-blur-xl border-b" style={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: 'rgba(11, 30, 63, 0.1)'
      }}>
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <BackButton to={`/courses/${id}`} showHome />
              <div className="flex-1 min-w-0">
                <h1 className="text-sm font-bold truncate" style={{ color: '#0B1E3F' }}>
                  {course.title}
                </h1>
                <div className="flex items-center space-x-2 text-xs" style={{ color: '#6F73D2' }}>
                  <span>Lesson {lessons.findIndex(l => l.id === currentLesson?.id) + 1}/{lessons.length}</span>
                  <span>•</span>
                  <span>{getProgressPercentage()}%</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setShowLessonList(true)}
                className="p-2 rounded-xl transition-all duration-200 active:scale-95"
                style={{ backgroundColor: 'rgba(0, 181, 173, 0.1)' }}
              >
                <List className="h-5 w-5" style={{ color: '#00B5AD' }} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:block bg-white border-b" style={{ borderColor: '#E5E7EB' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <BackButton to={`/courses/${id}`} showHome />
              <div>
                <h1 className="text-lg font-semibold" style={{ color: '#0B1E3F' }}>
                  {course.title}
                </h1>
                <div className="flex items-center space-x-4 text-sm" style={{ color: '#6F73D2' }}>
                  <span>Lesson {lessons.findIndex(l => l.id === currentLesson?.id) + 1} of {lessons.length}</span>
                  <span>•</span>
                  <span>{getProgressPercentage()}% Complete</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="p-2 rounded-xl transition-all duration-200" style={{ color: '#6F73D2' }}>
                <Bookmark className="h-5 w-5" />
              </button>
              <button className="p-2 rounded-xl transition-all duration-200" style={{ color: '#6F73D2' }}>
                <Share2 className="h-5 w-5" />
              </button>
              <button 
                onClick={() => setShowSidebar(!showSidebar)}
                className="p-2 rounded-xl transition-all duration-200"
                style={{ color: '#6F73D2' }}
              >
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)] lg:h-[calc(100vh-80px)]">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Enhanced Video Player */}
          <div className="bg-black relative w-full">
            <div className="aspect-video lg:aspect-video bg-gray-900 flex items-center justify-center w-full">
              {currentLesson?.videoUrl ? (
                <EnhancedVideoPlayer
                  videoUrl={currentLesson.videoUrl}
                  poster={course.imageUrl}
                  onTimeUpdate={(time, dur) => {
                    setCurrentTime(time);
                    setDuration(dur);
                  }}
                  onComplete={handleCompleteLesson}
                  autoResume={true}
                  lessonId={currentLesson.id}
                  allowDownload={false}
                />
              ) : (
                <div className="text-center text-white">
                  <Video className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg">Video content coming soon</p>
                </div>
              )}
            </div>
          </div>

          {/* Lesson Content */}
          <div className="flex-1 overflow-y-auto" style={{ backgroundColor: '#F4F7FA' }}>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
              {currentLesson && (
                <div className="space-y-6">
                  {/* Notes & Bookmarks */}
                  <NotesAndBookmarks
                    lessonId={currentLesson.id}
                    currentTime={currentTime}
                    duration={duration}
                    onJumpToTime={(time) => {
                      const videoElement = document.querySelector('video');
                      if (videoElement) {
                        videoElement.currentTime = time;
                      }
                    }}
                  />
                  <div 
                    className="p-6 rounded-2xl border-2"
                    style={{
                      backgroundColor: 'white',
                      borderColor: '#E5E7EB'
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl lg:text-2xl font-bold" style={{ color: '#0B1E3F' }}>
                        {currentLesson.title}
                      </h2>
                      {completedLessons.includes(currentLesson.id) && (
                        <div className="flex items-center space-x-1 px-3 py-1.5 rounded-full" style={{ backgroundColor: 'rgba(0, 181, 173, 0.1)' }}>
                          <Check className="h-4 w-4" style={{ color: '#00B5AD' }} />
                          <span className="text-xs font-semibold" style={{ color: '#00B5AD' }}>Completed</span>
                        </div>
                      )}
                    </div>

                    <div className="prose prose-lg max-w-none">
                      <p className="leading-relaxed" style={{ color: '#0B1E3F' }}>
                        {currentLesson.content}
                      </p>
                    </div>
                  </div>

                  {/* Lesson Materials */}
                  {materials.filter(m => m.courseId === id).length > 0 && (
                    <div 
                      className="p-6 rounded-2xl border-2"
                      style={{
                        backgroundColor: 'white',
                        borderColor: '#E5E7EB'
                      }}
                    >
                      <h3 className="text-lg font-bold mb-4" style={{ color: '#0B1E3F' }}>
                        Lesson Materials
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {materials
                          .filter(m => m.courseId === id)
                          .map((material) => (
                            <div
                              key={material.id}
                              className="flex items-center space-x-3 p-4 rounded-xl border-2 transition-all duration-200 active:scale-95"
                              style={{
                                backgroundColor: 'white',
                                borderColor: '#E5E7EB'
                              }}
                            >
                              <div 
                                className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{ backgroundColor: 'rgba(0, 181, 173, 0.1)' }}
                              >
                                <FileText className="h-5 w-5" style={{ color: '#00B5AD' }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold truncate" style={{ color: '#0B1E3F' }}>
                                  {material.title}
                                </h4>
                                <p className="text-sm truncate" style={{ color: '#6F73D2' }}>
                                  {material.type}
                                </p>
                              </div>
                              <button 
                                className="p-2 rounded-xl transition-all duration-200 active:scale-95"
                                style={{ backgroundColor: 'rgba(0, 181, 173, 0.1)' }}
                              >
                                <Download className="h-5 w-5" style={{ color: '#00B5AD' }} />
                              </button>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Q&A Section */}
                  <LessonQandA lessonId={currentLesson.id} courseId={id} />

                  {/* Navigation */}
                  <div 
                    className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-6 border-t"
                    style={{ borderColor: '#E5E7EB' }}
                  >
                    <button
                      onClick={() => {
                        const prev = getPreviousLesson();
                        if (prev) handleLessonClick(prev);
                      }}
                      disabled={!getPreviousLesson()}
                      className="flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 border-2"
                      style={{ 
                        borderColor: '#E5E7EB',
                        color: '#0B1E3F',
                        backgroundColor: 'white'
                      }}
                    >
                      <ArrowLeft className="h-5 w-5" />
                      <span>Previous</span>
                    </button>

                    <button
                      onClick={handleCompleteLesson}
                      className="px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300 active:scale-95"
                      style={{ 
                        backgroundColor: completedLessons.includes(currentLesson.id) ? '#6F73D2' : '#00B5AD',
                        boxShadow: '0 4px 14px rgba(0, 181, 173, 0.3)'
                      }}
                    >
                      {completedLessons.includes(currentLesson.id) ? 'Completed ✓' : 'Mark as Complete'}
                    </button>

                    <button
                      onClick={() => {
                        const next = getNextLesson();
                        if (next) handleLessonClick(next);
                      }}
                      disabled={!getNextLesson()}
                      className="flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                      style={{ 
                        backgroundColor: '#00B5AD',
                        boxShadow: '0 4px 14px rgba(0, 181, 173, 0.3)'
                      }}
                    >
                      <span>Next</span>
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Sidebar - Udemy Style */}
        {showSidebar && (
          <div className="hidden lg:block w-96 bg-white border-l overflow-y-auto" style={{ borderColor: '#E5E7EB' }}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold" style={{ color: '#0B1E3F' }}>
                  Course Content
                </h3>
                <button
                  onClick={() => setShowSidebar(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="h-5 w-5" style={{ color: '#6F73D2' }} />
                </button>
              </div>
              
              {/* Progress Overview */}
              <div 
                className="mb-6 p-4 rounded-xl border-2"
                style={{ 
                  backgroundColor: 'rgba(0, 181, 173, 0.05)',
                  borderColor: '#E5E7EB'
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold" style={{ color: '#0B1E3F' }}>Course Progress</span>
                  <span className="text-sm font-bold" style={{ color: '#00B5AD' }}>
                    {getTotalProgress()}%
                  </span>
                </div>
                <div className="w-full rounded-full h-2 mb-2" style={{ backgroundColor: '#E5E7EB' }}>
                  <div 
                    className="h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${getTotalProgress()}%`,
                      backgroundColor: '#00B5AD'
                    }}
                  ></div>
                </div>
                <div className="flex items-center justify-between text-xs" style={{ color: '#6F73D2' }}>
                  <span>{completedLessons.length} of {lessons.length} lessons completed</span>
                </div>
              </div>

              {/* Curriculum with Modules */}
              <div className="space-y-1">
                {curriculum.length > 0 ? (
                  curriculum.map((module: any, moduleIndex: number) => {
                    const moduleLessons = module.lessons || [];
                    const moduleProgress = getModuleProgress(module);
                    const isExpanded = expandedModules.includes(moduleIndex);
                    
                    return (
                      <div key={moduleIndex} className="border-b" style={{ borderColor: '#E5E7EB' }}>
                        {/* Module Header */}
                        <button
                          onClick={() => toggleModule(moduleIndex)}
                          className="w-full text-left p-3 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 flex-1">
                              <ChevronDown 
                                className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                style={{ color: '#6F73D2' }}
                              />
                              <div className="flex-1">
                                <h4 className="font-semibold text-sm" style={{ color: '#0B1E3F' }}>
                                  {module.title || module.name || `Module ${moduleIndex + 1}`}
                                </h4>
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className="text-xs" style={{ color: '#6F73D2' }}>
                                    {moduleLessons.length} lessons
                                  </span>
                                  {moduleProgress > 0 && (
                                    <>
                                      <span className="text-xs" style={{ color: '#6F73D2' }}>•</span>
                                      <span className="text-xs font-medium" style={{ color: '#00B5AD' }}>
                                        {moduleProgress}% complete
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </button>

                        {/* Module Lessons */}
                        {isExpanded && (
                          <div className="pl-8 pr-2 pb-2 space-y-1">
                            {moduleLessons.map((lesson: Lesson, lessonIndex: number) => {
                              const isActive = currentLesson?.id === lesson.id;
                              const isCompleted = completedLessons.includes(lesson.id);
                              
                              return (
                                <button
                                  key={lesson.id}
                                  onClick={() => handleLessonClick(lesson)}
                                  className={`w-full text-left p-2.5 rounded-lg transition-all duration-200 ${
                                    isActive ? 'bg-blue-50' : 'hover:bg-gray-50'
                                  }`}
                                  style={{
                                    borderLeft: isActive ? '3px solid #00B5AD' : '3px solid transparent'
                                  }}
                                >
                                  <div className="flex items-center space-x-3">
                                    <div className="flex-shrink-0">
                                      {isCompleted ? (
                                        <div 
                                          className="w-6 h-6 rounded-full flex items-center justify-center"
                                          style={{ backgroundColor: '#00B5AD' }}
                                        >
                                          <Check className="h-3 w-3 text-white" />
                                        </div>
                                      ) : (
                                        <div 
                                          className="w-6 h-6 border rounded-full flex items-center justify-center"
                                          style={{ 
                                            borderColor: isActive ? '#00B5AD' : '#E5E7EB',
                                            color: isActive ? '#00B5AD' : '#6F73D2'
                                          }}
                                        >
                                          <span className="text-xs font-semibold">
                                            {lessonIndex + 1}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h5 className={`text-sm font-medium truncate ${
                                        isActive ? 'text-[#00B5AD]' : ''
                                      }`} style={{ color: isActive ? '#00B5AD' : '#0B1E3F' }}>
                                        {lesson.title}
                                      </h5>
                                      {lesson.videoUrl && (
                                        <div className="flex items-center space-x-1 mt-0.5">
                                          <Video className="h-3 w-3" style={{ color: '#6F73D2' }} />
                                          <span className="text-xs" style={{ color: '#6F73D2' }}>
                                            Video
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  // Fallback: Flat lessons list if no curriculum structure
                  <div className="space-y-1">
                    {lessons.map((lesson, index) => {
                      const isActive = currentLesson?.id === lesson.id;
                      const isCompleted = completedLessons.includes(lesson.id);
                      
                      return (
                        <button
                          key={lesson.id}
                          onClick={() => handleLessonClick(lesson)}
                          className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                            isActive ? 'bg-blue-50' : 'hover:bg-gray-50'
                          }`}
                          style={{
                            borderLeft: isActive ? '3px solid #00B5AD' : '3px solid transparent'
                          }}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              {isCompleted ? (
                                <div 
                                  className="w-8 h-8 rounded-full flex items-center justify-center"
                                  style={{ backgroundColor: '#00B5AD' }}
                                >
                                  <Check className="h-4 w-4 text-white" />
                                </div>
                              ) : (
                                <div 
                                  className="w-8 h-8 border-2 rounded-full flex items-center justify-center"
                                  style={{ 
                                    borderColor: isActive ? '#00B5AD' : '#E5E7EB',
                                    color: isActive ? '#00B5AD' : '#6F73D2'
                                  }}
                                >
                                  <span className="text-xs font-semibold">
                                    {index + 1}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className={`font-semibold truncate ${
                                isActive ? 'text-[#00B5AD]' : ''
                              }`} style={{ color: isActive ? '#00B5AD' : '#0B1E3F' }}>
                                {lesson.title}
                              </h4>
                              <p className="text-xs truncate mt-0.5" style={{ color: '#6F73D2' }}>
                                {lesson.content.substring(0, 40)}...
                              </p>
                            </div>
                            <Video className="h-4 w-4 flex-shrink-0" style={{ color: '#6F73D2' }} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Sidebar Toggle Button (when hidden) */}
        {!showSidebar && (
          <button
            onClick={() => setShowSidebar(true)}
            className="hidden lg:block fixed right-4 top-1/2 -translate-y-1/2 z-30 p-3 bg-white rounded-l-lg shadow-lg border border-r-0"
            style={{ borderColor: '#E5E7EB' }}
          >
            <List className="h-5 w-5" style={{ color: '#00B5AD' }} />
          </button>
        )}

        {/* Mobile Lesson List Bottom Sheet */}
        <BottomSheet
          isOpen={showLessonList}
          onClose={() => setShowLessonList(false)}
          title="Course Content"
          maxHeight="85vh"
        >
          <div className="p-4">
            {/* Progress Overview */}
            <div 
              className="mb-6 p-4 rounded-xl"
              style={{ backgroundColor: 'rgba(0, 181, 173, 0.1)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold" style={{ color: '#0B1E3F' }}>Progress</span>
                <span className="text-sm font-bold" style={{ color: '#00B5AD' }}>
                  {getProgressPercentage()}%
                </span>
              </div>
              <div className="w-full rounded-full h-2" style={{ backgroundColor: '#E5E7EB' }}>
                <div 
                  className="h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${getProgressPercentage()}%`,
                    backgroundColor: '#00B5AD'
                  }}
                ></div>
              </div>
              <div className="flex items-center justify-between mt-2 text-xs" style={{ color: '#6F73D2' }}>
                <span>{completedLessons.length} of {lessons.length} lessons</span>
                <span>{curriculum.length > 0 ? Math.round((completedLessons.length / lessons.length) * curriculum.length) : 0} modules</span>
              </div>
            </div>

            {/* Lessons List */}
            <div className="space-y-3">
              {lessons.map((lesson, index) => (
                <button
                  key={lesson.id}
                  onClick={() => {
                    handleLessonClick(lesson);
                    setShowLessonList(false);
                  }}
                  className={`w-full text-left p-4 rounded-xl transition-all duration-200 active:scale-95 ${
                    currentLesson?.id === lesson.id ? 'scale-105' : ''
                  }`}
                  style={{
                    backgroundColor: currentLesson?.id === lesson.id 
                      ? 'rgba(0, 181, 173, 0.1)' 
                      : 'white',
                    border: currentLesson?.id === lesson.id 
                      ? '2px solid #00B5AD' 
                      : '2px solid #E5E7EB'
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {completedLessons.includes(lesson.id) ? (
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: '#00B5AD' }}
                        >
                          <Check className="h-5 w-5 text-white" />
                        </div>
                      ) : (
                        <div 
                          className="w-10 h-10 border-2 rounded-xl flex items-center justify-center"
                          style={{ 
                            borderColor: '#E5E7EB',
                            color: '#6F73D2'
                          }}
                        >
                          <span className="text-sm font-bold">
                            {index + 1}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold truncate mb-1" style={{ color: '#0B1E3F' }}>{lesson.title}</h4>
                      <p className="text-sm truncate" style={{ color: '#6F73D2' }}>
                        {lesson.content.substring(0, 60)}...
                      </p>
                    </div>
                    <Video className="h-5 w-5 flex-shrink-0" style={{ color: '#6F73D2' }} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </BottomSheet>
      </div>
    </div>
  );
}; 