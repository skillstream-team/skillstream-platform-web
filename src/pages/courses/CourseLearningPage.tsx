import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Course, Lesson, Material } from '../../types';
import { BackButton } from '../../components/common/BackButton';
import { getCourseByIdWithLanguage, getLessonByIdWithLanguage, getMaterialByIdWithLanguage } from '../../services/api';
import { Bookmark, Share2, Settings, VolumeX, Volume2, Maximize2, Video, Check, FileText, Download, ArrowLeft, ArrowRight, List, X } from 'lucide-react';
import { BottomSheet } from '../../components/mobile/BottomSheet';

export const CourseLearningPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showLessonList, setShowLessonList] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!id) return;
    async function loadData() {
      setIsLoading(true);
      try {
        const courseData = await getCourseByIdWithLanguage(Number(id));
        setCourse(courseData);
        // Fetch lessons and materials using real API endpoints
        const lessonsData = courseData.lessons || [];
        setLessons(lessonsData);
        setMaterials(courseData.materials || []);
        setCurrentLesson(lessonsData.length > 0 ? lessonsData[0] : null);
      } catch (error) {
        setCourse(null);
        setLessons([]);
        setMaterials([]);
        setCurrentLesson(null);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleLessonClick = (lesson: Lesson) => {
    setCurrentLesson(lesson);
    setCurrentTime(0);
  };

  const handleVideoPlay = () => {
    // setIsVideoPlaying(true); // This line was removed as per the edit hint.
  };

  const handleVideoPause = () => {
    // setIsVideoPlaying(false); // This line was removed as per the edit hint.
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
      <div className="flex items-center justify-center h-64" style={{ backgroundColor: '#F4F7FA' }}>
        <div 
          className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent"
          style={{ borderColor: '#00B5AD' }}
        ></div>
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

  const courseDetails = {
    curriculum: [
      { title: 'Introduction', lessons: lessons.slice(0, 3) },
      { title: 'Basic Concepts', lessons: lessons.slice(3, 6) },
      { title: 'Advanced Topics', lessons: lessons.slice(6, 9) },
      { title: 'Conclusion', lessons: lessons.slice(9, 12) },
    ],
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
          {/* Video Player - Mobile Full Width */}
          <div className="bg-black relative w-full">
            <div className="aspect-video lg:aspect-video bg-gray-900 flex items-center justify-center w-full">
              {currentLesson?.videoUrl ? (
                <div className="relative w-full h-full">
                  <video
                    className="w-full h-full object-cover"
                    controls
                    onPlay={handleVideoPlay}
                    onPause={handleVideoPause}
                    onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                    onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                  >
                    <source src={currentLesson.videoUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                  
                  {/* Custom Video Controls */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <div className="flex items-center justify-between text-white">
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => setIsMuted(!isMuted)}
                          className="p-2 hover:bg-white/20 rounded"
                        >
                          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                        </button>
                        <div className="text-sm">
                          {Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(0).padStart(2, '0')} / 
                          {Math.floor(duration / 60)}:{(duration % 60).toFixed(0).padStart(2, '0')}
                        </div>
                      </div>
                      <button
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="p-2 hover:bg-white/20 rounded"
                      >
                        <Maximize2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
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

        {/* Desktop Sidebar */}
        {showSidebar && (
          <div className="hidden lg:block w-80 bg-white border-l overflow-y-auto" style={{ borderColor: '#E5E7EB' }}>
            <div className="p-4">
              <h3 className="text-lg font-bold mb-4" style={{ color: '#0B1E3F' }}>
                Course Content
              </h3>
              
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
                  <span>{Math.round((completedLessons.length / lessons.length) * courseDetails.curriculum.length)} weeks</span>
                </div>
              </div>

              {/* Lessons List */}
              <div className="space-y-2">
                {lessons.map((lesson, index) => (
                  <button
                    key={lesson.id}
                    onClick={() => handleLessonClick(lesson)}
                    className={`w-full text-left p-3 rounded-xl transition-all duration-200 ${
                      currentLesson?.id === lesson.id ? 'scale-105' : ''
                    }`}
                    style={{
                      backgroundColor: currentLesson?.id === lesson.id 
                        ? 'rgba(0, 181, 173, 0.1)' 
                        : 'transparent',
                      border: currentLesson?.id === lesson.id ? '2px solid #00B5AD' : '2px solid transparent'
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {completedLessons.includes(lesson.id) ? (
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
                              borderColor: '#E5E7EB',
                              color: '#6F73D2'
                            }}
                          >
                            <span className="text-xs font-semibold">
                              {index + 1}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate" style={{ color: '#0B1E3F' }}>{lesson.title}</h4>
                        <p className="text-xs truncate" style={{ color: '#6F73D2' }}>
                          {lesson.content.substring(0, 50)}...
                        </p>
                      </div>
                      <Video className="h-4 w-4 flex-shrink-0" style={{ color: '#6F73D2' }} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
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
                <span>{Math.round((completedLessons.length / lessons.length) * courseDetails.curriculum.length)} weeks</span>
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