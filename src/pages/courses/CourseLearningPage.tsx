import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Course, Lesson, Material } from '../../types';
import { BackButton } from '../../components/common/BackButton';
import { getCourseByIdWithLanguage, getLessonByIdWithLanguage, getMaterialByIdWithLanguage } from '../../services/api';
import { Bookmark, Share2, Settings, VolumeX, Volume2, Maximize2, Video, Check, FileText, Download, ArrowLeft, ArrowRight } from 'lucide-react';

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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Course not found</h3>
        <p className="text-gray-500 dark:text-gray-400">The course you're looking for doesn't exist.</p>
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <BackButton to={`/courses/${id}`} showHome />
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {course.title}
                </h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                  <span>Lesson {lessons.findIndex(l => l.id === currentLesson?.id) + 1} of {lessons.length}</span>
                  <span>•</span>
                  <span>{getProgressPercentage()}% Complete</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <Bookmark className="h-5 w-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <Share2 className="h-5 w-5" />
              </button>
              <button 
                onClick={() => setShowSidebar(!showSidebar)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Video Player */}
          <div className="bg-black relative">
            <div className="aspect-video bg-gray-900 flex items-center justify-center">
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
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {currentLesson && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {currentLesson.title}
                    </h2>
                    <div className="flex items-center space-x-2">
                      {completedLessons.includes(currentLesson.id) && (
                        <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                          <Check className="h-5 w-5" />
                          <span className="text-sm font-medium">Completed</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="prose prose-lg dark:prose-invert max-w-none">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {currentLesson.content}
                    </p>
                  </div>

                  {/* Lesson Materials */}
                  {materials.filter(m => m.courseId === id).length > 0 && (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Lesson Materials
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {materials
                          .filter(m => m.courseId === id)
                          .map((material) => (
                            <div
                              key={material.id}
                              className="flex items-center space-x-3 p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                              <FileText className="h-5 w-5 text-blue-500" />
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900 dark:text-white">
                                  {material.title}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {material.type}
                                </p>
                              </div>
                              <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                <Download className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => {
                        const prev = getPreviousLesson();
                        if (prev) handleLessonClick(prev);
                      }}
                      disabled={!getPreviousLesson()}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span>Previous</span>
                    </button>

                    <button
                      onClick={handleCompleteLesson}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                      {completedLessons.includes(currentLesson.id) ? 'Completed' : 'Mark as Complete'}
                    </button>

                    <button
                      onClick={() => {
                        const next = getNextLesson();
                        if (next) handleLessonClick(next);
                      }}
                      disabled={!getNextLesson()}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>Next</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        {showSidebar && (
          <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Course Content
              </h3>
              
              {/* Progress Overview */}
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</span>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    {getProgressPercentage()}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getProgressPercentage()}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-gray-600 dark:text-gray-400">
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
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      currentLesson?.id === lesson.id
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {completedLessons.includes(lesson.id) ? (
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 border-2 border-gray-300 dark:border-gray-600 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                              {index + 1}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{lesson.title}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {lesson.content.substring(0, 50)}...
                        </p>
                      </div>
                      <Video className="h-4 w-4 text-gray-400" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 