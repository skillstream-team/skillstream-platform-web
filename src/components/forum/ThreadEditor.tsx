import React, { useState } from 'react';
import { 
  X, 
  Save, 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Link, 
  Image, 
  Upload,
  Tag,
  Eye,
  Code,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Settings
} from 'lucide-react';
import { ForumCategory, ForumThread } from '../../types';
import { apiService } from '../../services/api';
import { useAuthStore } from '../../store/auth';

interface ThreadEditorProps {
  courseId: string;
  categories: ForumCategory[];
  threadId?: string;
  initialData?: Partial<ForumThread>;
  onClose: () => void;
  onSave: (thread: ForumThread) => void;
}

export const ThreadEditor: React.FC<ThreadEditorProps> = ({
  courseId,
  categories,
  threadId,
  initialData,
  onClose,
  onSave
}) => {
  const { user } = useAuthStore();
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || categories[0]?.id || '');
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [newTag, setNewTag] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<any[]>(initialData?.attachments || []);

  const updateContent = (newContent: string) => {
    // Save current content to undo stack
    if (content) {
      setUndoStack(prev => [...prev, content]);
      setRedoStack([]); // Clear redo stack when new content is added
    }
    
    setContent(newContent);
  };

  const undo = () => {
    if (undoStack.length > 0) {
      const previousContent = undoStack[undoStack.length - 1];
      setRedoStack(prev => [...prev, content]);
      setUndoStack(prev => prev.slice(0, -1));
      setContent(previousContent);
    }
  };

  const redo = () => {
    if (redoStack.length > 0) {
      const nextContent = redoStack[redoStack.length - 1];
      setUndoStack(prev => [...prev, content]);
      setRedoStack(prev => prev.slice(0, -1));
      setContent(nextContent);
    }
  };

  const formatText = (format: string) => {
    const textarea = document.getElementById('thread-content') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    let formattedText = '';
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'underline':
        formattedText = `__${selectedText}__`;
        break;
      case 'code':
        formattedText = `\`${selectedText}\``;
        break;
      case 'quote':
        formattedText = `> ${selectedText}`;
        break;
      case 'link':
        formattedText = `[${selectedText}](url)`;
        break;
      case 'image':
        formattedText = `![${selectedText}](image-url)`;
        break;
      case 'list':
        formattedText = selectedText.split('\n').map(line => `- ${line}`).join('\n');
        break;
      case 'ordered-list':
        formattedText = selectedText.split('\n').map((line, index) => `${index + 1}. ${line}`).join('\n');
        break;
    }

    const newContent = content.substring(0, start) + formattedText + content.substring(end);
    updateContent(newContent);
  };

  const insertContent = (contentToInsert: string) => {
    const textarea = document.getElementById('thread-content') as HTMLTextAreaElement;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const newContent = content.substring(0, cursorPos) + contentToInsert + content.substring(cursorPos);
    updateContent(newContent);
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags(prev => [...prev, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const uploadMedia = async (file: File) => {
    try {
      setLoading(true);
      const uploadedFile = await apiService.uploadFile(file, 'forum');
      
      const newAttachment = {
        id: uploadedFile.id,
        filename: file.name,
        originalName: file.name,
        url: uploadedFile.url,
        size: file.size,
        mimeType: file.type,
        uploadedBy: user?.id || '',
        createdAt: new Date().toISOString()
      };

      setAttachments(prev => [...prev, newAttachment]);

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

  const saveThread = async () => {
    if (!title.trim() || !content.trim()) {
      alert('Please fill in both title and content');
      return;
    }

    try {
      setLoading(true);
      
      const threadData = {
        title: title.trim(),
        content: content.trim(),
        categoryId,
        courseId,
        authorId: user?.id || '',
        tags,
        attachments,
        isPinned: false,
        isLocked: false,
        isSticky: false
      };

      let savedThread: ForumThread;
      
      if (threadId) {
        savedThread = await apiService.updateForumThread(threadId, threadData);
      } else {
        savedThread = await apiService.createForumThread(threadData);
      }

      onSave(savedThread);
    } catch (error) {
      console.error('Error saving thread:', error);
      alert('Error saving thread. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || 'General';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {threadId ? 'Edit Discussion' : 'New Discussion'}
            </h3>
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
              onClick={saveThread}
              disabled={loading || !title.trim() || !content.trim()}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Thread'}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-col h-[calc(90vh-120px)]">
          {/* Thread Info */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Thread Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter thread title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tags */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap items-center space-x-2 mb-2">
                {tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Add a tag..."
                />
                <button
                  onClick={addTag}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
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
                <h1>{title}</h1>
                <div dangerouslySetInnerHTML={{ __html: content }} />
              </div>
            ) : (
              <textarea
                id="thread-content"
                value={content}
                onChange={(e) => updateContent(e.target.value)}
                className="w-full h-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                placeholder="Start writing your discussion content here... You can use Markdown formatting."
              />
            )}
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