import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  FileText,
  HelpCircle,
  Plus,
  Search,
  Filter,
  Grid,
  List,
  Star,
  Copy,
  Trash2,
  Eye,
  Tag
} from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { useNotification } from '../../hooks/useNotification';
import { getMyCourses } from '../../services/api';

interface ContentTemplate {
  id: string;
  type: 'lesson' | 'quiz' | 'assignment' | 'module';
  title: string;
  description: string;
  content: any;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  usageCount: number;
}

export const ContentLibraryPage: React.FC = () => {
  const { user } = useAuthStore();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();
  
  const [templates, setTemplates] = useState<ContentTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<ContentTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    type: 'lesson' as ContentTemplate['type'],
    title: '',
    description: '',
    content: '',
    tags: [] as string[]
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [templates, searchQuery, selectedType, selectedTag]);

  const loadTemplates = () => {
    try {
      const stored = localStorage.getItem(`content-templates-${user?.id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setTemplates(parsed);
      } else {
        setTemplates([]);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      setTemplates([]);
    } finally {
      setIsLoading(false);
    }
  };

  const saveTemplates = (templatesToSave: ContentTemplate[]) => {
    try {
      localStorage.setItem(`content-templates-${user?.id}`, JSON.stringify(templatesToSave));
      setTemplates(templatesToSave);
    } catch (error) {
      console.error('Error saving templates:', error);
      showError('Failed to Save Template', 'Unable to save template. Please try again.');
    }
  };

  const filterTemplates = () => {
    let filtered = [...templates];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(template =>
        template.title.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(template => template.type === selectedType);
    }

    if (selectedTag !== 'all') {
      filtered = filtered.filter(template => template.tags.includes(selectedTag));
    }

    setFilteredTemplates(filtered);
  };

  const getAllTags = (): string[] => {
    const tagSet = new Set<string>();
    templates.forEach(template => {
      template.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  };

  const handleCreateTemplate = () => {
    if (!newTemplate.title.trim()) {
      showError('Missing Title', 'Please enter a template title.');
      return;
    }

    const template: ContentTemplate = {
      id: Date.now().toString(),
      type: newTemplate.type,
      title: newTemplate.title,
      description: newTemplate.description,
      content: newTemplate.content,
      tags: newTemplate.tags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0
    };

    saveTemplates([...templates, template]);
    setNewTemplate({
      type: 'lesson',
      title: '',
      description: '',
      content: '',
      tags: []
    });
    setShowCreateModal(false);
    showSuccess('Template Created', 'Your template has been saved to the library.');
  };

  const handleUseTemplate = (template: ContentTemplate) => {
    // Navigate to appropriate creation page with template data
    if (template.type === 'lesson') {
      navigate(`/lessons/create?template=${template.id}`);
    } else if (template.type === 'quiz') {
      navigate(`/quizzes/create?template=${template.id}`);
    } else if (template.type === 'assignment') {
      navigate(`/assignments/create?template=${template.id}`);
    }
    
    // Update usage count
    const updated = templates.map(t =>
      t.id === template.id ? { ...t, usageCount: t.usageCount + 1, updatedAt: new Date().toISOString() } : t
    );
    saveTemplates(updated);
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (window.confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      const updated = templates.filter(t => t.id !== templateId);
      saveTemplates(updated);
      showSuccess('Template Deleted', 'The template has been deleted successfully.');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'lesson':
        return <BookOpen className="w-5 h-5" />;
      case 'quiz':
        return <HelpCircle className="w-5 h-5" />;
      case 'assignment':
        return <FileText className="w-5 h-5" />;
      case 'module':
        return <BookOpen className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'lesson':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'quiz':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'assignment':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'module':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                <BookOpen className="w-8 h-8 mr-3 text-blue-600 dark:text-blue-400" />
                Content Library
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Save and reuse your content templates
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Save Template
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search templates..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Types</option>
                <option value="lesson">Lessons</option>
                <option value="quiz">Quizzes</option>
                <option value="assignment">Assignments</option>
                <option value="module">Modules</option>
              </select>
            </div>

            {/* View Mode */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tag Filter */}
          {getAllTags().length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedTag('all')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedTag === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                All Tags
              </button>
              {getAllTags().map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedTag === tag
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Tag className="w-3 h-3 inline mr-1" />
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Templates Grid/List */}
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg">
            <BookOpen className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No templates found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {templates.length === 0
                ? 'Start building your content library by saving templates.'
                : 'Try adjusting your search or filters.'}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="w-5 h-5 inline mr-2" />
              Create First Template
            </button>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredTemplates.map(template => (
              <div
                key={template.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow hover-lift"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${getTypeColor(template.type)}`}>
                      {getTypeIcon(template.type)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {template.title}
                      </h3>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getTypeColor(template.type)}`}>
                        {template.type}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleUseTemplate(template)}
                      className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                      title="Use template"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                      title="Delete template"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {template.description || 'No description'}
                </p>

                {template.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {template.tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Used {template.usageCount} time{template.usageCount !== 1 ? 's' : ''}</span>
                  <span>{new Date(template.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Template Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Save Template
                  </h3>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <Trash2 className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Type
                    </label>
                    <select
                      value={newTemplate.type}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, type: e.target.value as ContentTemplate['type'] }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="lesson">Lesson</option>
                      <option value="quiz">Quiz</option>
                      <option value="assignment">Assignment</option>
                      <option value="module">Module</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={newTemplate.title}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Template title..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={newTemplate.description}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Template description..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Content (JSON or text)
                    </label>
                    <textarea
                      value={newTemplate.content}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))}
                      rows={6}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white font-mono text-sm"
                      placeholder="Template content (can be JSON, HTML, or plain text)..."
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      onClick={() => {
                        setShowCreateModal(false);
                        setNewTemplate({
                          type: 'lesson',
                          title: '',
                          description: '',
                          content: '',
                          tags: []
                        });
                      }}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateTemplate}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Save Template
                    </button>
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

