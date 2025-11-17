import React, { useState } from 'react';
import { BookOpen, Zap, Users, FileText, Save, X, Plus } from 'lucide-react';

interface LessonTemplate {
  id: string;
  name: string;
  subject: string;
  description: string;
  duration: number;
  structure: {
    sections: Array<{
      title: string;
      duration: number;
      activities: string[];
    }>;
  };
  icon: React.ReactNode;
}

const defaultTemplates: LessonTemplate[] = [
  {
    id: 'physics-problem-solving',
    name: 'Physics Problem Solving',
    subject: 'Physics',
    description: 'Structured approach to solving physics problems',
    duration: 60,
    structure: {
      sections: [
        { title: 'Introduction', duration: 5, activities: ['Review concepts'] },
        { title: 'Problem Analysis', duration: 15, activities: ['Break down problem', 'Identify variables'] },
        { title: 'Solution', duration: 30, activities: ['Work through solution', 'Show calculations'] },
        { title: 'Practice', duration: 10, activities: ['Similar problems', 'Q&A'] }
      ]
    },
    icon: <Zap className="h-6 w-6" />
  },
  {
    id: 'math-tutoring',
    name: 'One-on-One Math Tutoring',
    subject: 'Mathematics',
    description: 'Personalized math help session',
    duration: 45,
    structure: {
      sections: [
        { title: 'Warm-up', duration: 5, activities: ['Review previous work'] },
        { title: 'Main Lesson', duration: 30, activities: ['Explain concepts', 'Work examples'] },
        { title: 'Practice', duration: 10, activities: ['Guided practice', 'Independent work'] }
      ]
    },
    icon: <BookOpen className="h-6 w-6" />
  },
  {
    id: 'group-study',
    name: 'Group Study Session',
    subject: 'General',
    description: 'Collaborative learning with multiple students',
    duration: 90,
    structure: {
      sections: [
        { title: 'Introduction', duration: 10, activities: ['Set goals', 'Review agenda'] },
        { title: 'Group Work', duration: 60, activities: ['Breakout rooms', 'Collaborative exercises'] },
        { title: 'Review', duration: 20, activities: ['Share findings', 'Q&A'] }
      ]
    },
    icon: <Users className="h-6 w-6" />
  }
];

interface LessonTemplatesProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: LessonTemplate) => void;
  onSaveTemplate?: (template: LessonTemplate) => void;
}

export const LessonTemplates: React.FC<LessonTemplatesProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
  onSaveTemplate
}) => {
  const [templates, setTemplates] = useState<LessonTemplate[]>(defaultTemplates);
  const [showCreate, setShowCreate] = useState(false);
  const [newTemplate, setNewTemplate] = useState<Partial<LessonTemplate>>({
    name: '',
    subject: '',
    description: '',
    duration: 60,
    structure: { sections: [] }
  });

  const handleSelect = (template: LessonTemplate) => {
    onSelectTemplate(template);
    onClose();
  };

  const handleSaveTemplate = () => {
    if (!newTemplate.name || !newTemplate.subject) {
      alert('Please fill in name and subject');
      return;
    }

    const template: LessonTemplate = {
      id: `template-${Date.now()}`,
      name: newTemplate.name!,
      subject: newTemplate.subject!,
      description: newTemplate.description || '',
      duration: newTemplate.duration || 60,
      structure: newTemplate.structure || { sections: [] },
      icon: <FileText className="h-6 w-6" />
    };

    // TODO: Replace with actual API call
    // await apiService.saveLessonTemplate(template);
    
    setTemplates(prev => [...prev, template]);
    setShowCreate(false);
    setNewTemplate({
      name: '',
      subject: '',
      description: '',
      duration: 60,
      structure: { sections: [] }
    });
    onSaveTemplate?.(template);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Lesson Templates</h2>
                <p className="text-blue-100 text-sm">
                  Quick setup for common lesson types
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowCreate(true)}
                className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all font-semibold text-sm flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Create Template</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {showCreate ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Physics Problem Solving"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    value={newTemplate.subject}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., Physics"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={newTemplate.duration}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleSaveTemplate}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-semibold"
                >
                  Save Template
                </button>
                <button
                  onClick={() => {
                    setShowCreate(false);
                    setNewTemplate({
                      name: '',
                      subject: '',
                      description: '',
                      duration: 60,
                      structure: { sections: [] }
                    });
                  }}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white rounded-xl hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 transition-all cursor-pointer"
                  onClick={() => handleSelect(template)}
                >
                  <div className="flex items-start space-x-3 mb-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl text-white">
                      {template.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {template.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {template.subject} • {template.duration} min
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {template.description}
                  </p>
                  <div className="space-y-2">
                    {template.structure.sections.map((section, index) => (
                      <div key={index} className="text-xs text-gray-500 dark:text-gray-400">
                        {section.title} ({section.duration} min)
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

