import React, { useState, useEffect } from 'react';
import { X, Save, Bold, Italic, Underline, List, ListOrdered, Link, Upload, Eye, Code, Quote, Undo, Redo, Plus, Tag, Trash2 } from 'lucide-react';
import { Lesson, Material } from '../types';
import { apiService, getLessonByIdWithLanguage } from '../services/api';

interface LessonEditorProps {
  lessonId?: string;
  courseId: string;
  onClose: () => void;
  onSave: (lesson: Lesson) => void;
}

export const LessonEditor: React.FC<LessonEditorProps> = ({
  lessonId,
  courseId,
  onClose,
  onSave
}) => {
  const [lesson, setLesson] = useState<Partial<Lesson>>({
    title: '',
    content: '',
    scheduledAt: new Date().toISOString(),
    courseId: courseId,
    materials: [],
    attendance: []
  });
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);

  useEffect(() => {
    if (lessonId) {
      loadLesson();
    }
  }, [lessonId]);

  const loadLesson = async () => {
    if (!lessonId) return;
    
    try {
      setLoading(true);
      const lessonData = await getLessonByIdWithLanguage(Number(lessonId));
      setLesson(lessonData);
    } catch (error) {
      console.error('Error loading lesson:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateContent = (newContent: string) => {
    // Save current content to undo stack
    if (lesson.content) {
      setUndoStack(prev => [...prev, lesson.content!]);
      setRedoStack([]); // Clear redo stack when new content is added
    }
    
    setLesson(prev => ({ ...prev, content: newContent }));
  };

  const undo = () => {
    if (undoStack.length > 0) {
      const previousContent = undoStack[undoStack.length - 1];
      setRedoStack(prev => [...prev, lesson.content!]);
      setUndoStack(prev => prev.slice(0, -1));
      setLesson(prev => ({ ...prev, content: previousContent }));
    }
  };

  const redo = () => {
    if (redoStack.length > 0) {
      const nextContent = redoStack[redoStack.length - 1];
      setUndoStack(prev => [...prev, lesson.content!]);
      setRedoStack(prev => prev.slice(0, -1));
      setLesson(prev => ({ ...prev, content: nextContent }));
    }
  };

  const formatText = (format: string) => {
    const textarea = document.getElementById('lesson-content') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const contentStr = lesson.content || '';

    let formattedText = '';
    switch (format) {
      case 'bold':
        formattedText = `**${contentStr.substring(start, end)}**`;
        break;
      case 'italic':
        formattedText = `*${contentStr.substring(start, end)}*`;
        break;
      case 'underline':
        formattedText = `__${contentStr.substring(start, end)}__`;
        break;
      case 'code':
        formattedText = `\`${contentStr.substring(start, end)}\``;
        break;
      case 'quote':
        formattedText = `> ${contentStr.substring(start, end)}`;
        break;
      case 'link':
        formattedText = `[${contentStr.substring(start, end)}](url)`;
        break;
      case 'image':
        formattedText = `![${contentStr.substring(start, end)}](image-url)`;
        break;
      case 'video':
        formattedText = `![video](${contentStr.substring(start, end)})`;
        break;
      case 'list':
        formattedText = contentStr.substring(start, end).split('\n').map(line => `- ${line}`).join('\n');
        break;
      case 'ordered-list':
        formattedText = contentStr.substring(start, end).split('\n').map((line, index) => `${index + 1}. ${line}`).join('\n');
        break;
    }

    const newContent = lesson.content?.substring(0, start) + formattedText + lesson.content?.substring(end);
    updateContent(newContent || '');
  };

  const insertContent = (content: string) => {
    const textarea = document.getElementById('lesson-content') as HTMLTextAreaElement;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const newContent = lesson.content?.substring(0, cursorPos) + content + lesson.content?.substring(cursorPos);
    updateContent(newContent || '');
  };

  const uploadMedia = async (file: File) => {
    try {
      setLoading(true);
      const uploadedFile = await apiService.uploadFile(file, 'shared', {});
      
      const newMaterial: Material = {
        id: uploadedFile.id,
        title: file.name,
        url: uploadedFile.url,
        type: file.type.startsWith('image/') ? 'DOCUMENT' :
          file.type.startsWith('video/') ? 'VIDEO' :
          file.type === 'application/pdf' ? 'PDF' : 'DOCUMENT',
        courseId: courseId,
        createdAt: new Date().toISOString()
      };

      setLesson(prev => ({
        ...prev,
        materials: [...(prev.materials || []), newMaterial]
      }));

      // Insert media link into content
      const mediaLink = file.type.startsWith('image/') 
        ? `![${file.name}](${uploadedFile.url})`
        : `[${file.name}](${uploadedFile.url})`;
      
      insertContent(mediaLink);
    } catch (error) {
      console.error('Error uploading media:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveLesson = async () => {
    try {
      setLoading(true);
      
      let savedLesson: Lesson;
      
      if (lessonId) {
        savedLesson = await apiService.updateLesson(Number(lessonId), lesson);
      } else {
        savedLesson = await apiService.createLesson(lesson as any);
      }

      onSave(savedLesson);
    } catch (error) {
      console.error('Error saving lesson:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'IMAGE': return <Tag className="h-4 w-4" />;
      case 'VIDEO': return <Tag className="h-4 w-4" />; // Changed from Video to Tag
      case 'DOCUMENT': return <Tag className="h-4 w-4" />; // Changed from FileText to Tag
      default: return <Tag className="h-4 w-4" />; // Changed from FileText to Tag
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Lesson Editor</h2>
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
              onClick={saveLesson}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Lesson'}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(95vh-120px)]">
          {/* Main Editor */}
          <div className="flex-1 flex flex-col">
            {/* Lesson Info */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Lesson Title
                  </label>
                  <input
                    type="text"
                    value={lesson.title}
                    onChange={(e) => setLesson(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Enter lesson title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Scheduled Date
                  </label>
                  <input
                    type="datetime-local"
                    value={lesson.scheduledAt?.slice(0, 16)}
                    onChange={(e) => setLesson(prev => ({ ...prev, scheduledAt: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Toolbar */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
              <div className="flex items-center space-x-2 flex-wrap">
                <button
                  onClick={undo}
                  disabled={undoStack.length === 0}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded disabled:opacity-50"
                  title="Undo"
                >
                  <Undo className="h-4 w-4" />
                </button>
                <button
                  onClick={redo}
                  disabled={redoStack.length === 0}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded disabled:opacity-50"
                  title="Redo"
                >
                  <Redo className="h-4 w-4" />
                </button>
                
                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
                
                <button
                  onClick={() => formatText('bold')}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                  title="Bold"
                >
                  <Bold className="h-4 w-4" />
                </button>
                <button
                  onClick={() => formatText('italic')}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                  title="Italic"
                >
                  <Italic className="h-4 w-4" />
                </button>
                <button
                  onClick={() => formatText('underline')}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                  title="Underline"
                >
                  <Underline className="h-4 w-4" />
                </button>
                
                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
                
                <button
                  onClick={() => formatText('list')}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                  title="Bullet List"
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  onClick={() => formatText('ordered-list')}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                  title="Numbered List"
                >
                  <ListOrdered className="h-4 w-4" />
                </button>
                <button
                  onClick={() => formatText('quote')}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                  title="Quote"
                >
                  <Quote className="h-4 w-4" />
                </button>
                <button
                  onClick={() => formatText('code')}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                  title="Code"
                >
                  <Code className="h-4 w-4" />
                </button>
                
                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
                
                <button
                  onClick={() => formatText('link')}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                  title="Insert Link"
                >
                  <Link className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setShowMediaUpload(true)}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                  title="Upload Media"
                >
                  <Upload className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Content Editor */}
            <div className="flex-1 p-6">
              {previewMode ? (
                <div className="prose dark:prose-invert max-w-none">
                  <h1>{lesson.title}</h1>
                  <div dangerouslySetInnerHTML={{ __html: lesson.content || '' }} />
                </div>
              ) : (
                <textarea
                  id="lesson-content"
                  value={lesson.content}
                  onChange={(e) => updateContent(e.target.value)}
                  className="w-full h-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                  placeholder="Start writing your lesson content here... You can use Markdown formatting."
                />
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-80 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Lesson Materials</h3>
              
              <button
                onClick={() => setShowMediaUpload(true)}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mb-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Material
              </button>

              <div className="space-y-3">
                {lesson.materials?.map(material => (
                  <div key={material.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getMaterialIcon(material.type)}
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white text-sm">
                          {material.title}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-300">
                          {material.type}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setLesson(prev => ({
                          ...prev,
                          materials: prev.materials?.filter(m => m.id !== material.id)
                        }));
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                
                {(!lesson.materials || lesson.materials.length === 0) && (
                  <div className="text-center py-8">
                    <Tag className="h-8 w-8 text-gray-400 mx-auto mb-2" /> {/* Changed from FileText to Tag */}
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      No materials added yet
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Media Upload Modal */}
        {showMediaUpload && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upload Media</h3>
                  <button
                    onClick={() => setShowMediaUpload(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      Drag and drop files here, or click to select
                    </p>
                    <input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          uploadMedia(file);
                          setShowMediaUpload(false);
                        }
                      }}
                      accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Choose File
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 