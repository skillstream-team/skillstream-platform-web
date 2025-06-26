import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Target, 
  BookOpen, 
  Users, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle,
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Eye,
  Settings,
  Download,
  Share2
} from 'lucide-react';
import { Course, Lesson } from '../types';

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

interface CurriculumPlannerProps {
  course: Partial<Course>;
  sections: CourseSection[];
  onClose: () => void;
  onSave: (sections: CourseSection[]) => void;
}

export const CurriculumPlanner: React.FC<CurriculumPlannerProps> = ({
  course,
  sections,
  onClose,
  onSave
}) => {
  const [curriculumSections, setCurriculumSections] = useState<CourseSection[]>(sections);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [showObjectiveModal, setShowObjectiveModal] = useState(false);
  const [editingObjective, setEditingObjective] = useState<LearningObjective | null>(null);
  const [viewMode, setViewMode] = useState<'timeline' | 'objectives' | 'overview'>('overview');
  const [loading, setLoading] = useState(false);

  const addSection = () => {
    const newSection: CourseSection = {
      id: `section-${Date.now()}`,
      title: `New Module ${curriculumSections.length + 1}`,
      description: '',
      order: curriculumSections.length,
      lessons: [],
      objectives: [],
      estimatedDuration: 0,
      isExpanded: true
    };
    setCurriculumSections(prev => [...prev, newSection]);
    setSelectedSection(newSection.id);
  };

  const updateSection = (sectionId: string, updates: Partial<CourseSection>) => {
    setCurriculumSections(prev => prev.map(section => 
      section.id === sectionId ? { ...section, ...updates } : section
    ));
  };

  const deleteSection = (sectionId: string) => {
    setCurriculumSections(prev => prev.filter(section => section.id !== sectionId));
    if (selectedSection === sectionId) {
      setSelectedSection(null);
    }
  };

  const addObjective = (sectionId: string) => {
    const newObjective: LearningObjective = {
      id: `objective-${Date.now()}`,
      title: 'New Learning Objective',
      description: '',
      type: 'knowledge',
      difficulty: 'beginner',
      completed: false
    };

    setCurriculumSections(prev => prev.map(section => 
      section.id === sectionId 
        ? { ...section, objectives: [...section.objectives, newObjective] }
        : section
    ));

    setEditingObjective(newObjective);
    setShowObjectiveModal(true);
  };

  const updateObjective = (sectionId: string, objectiveId: string, updates: Partial<LearningObjective>) => {
    setCurriculumSections(prev => prev.map(section => 
      section.id === sectionId 
        ? {
            ...section,
            objectives: section.objectives.map(obj => 
              obj.id === objectiveId ? { ...obj, ...updates } : obj
            )
          }
        : section
    ));
  };

  const deleteObjective = (sectionId: string, objectiveId: string) => {
    setCurriculumSections(prev => prev.map(section => 
      section.id === sectionId 
        ? { ...section, objectives: section.objectives.filter(obj => obj.id !== objectiveId) }
        : section
    ));
  };

  const moveSection = (fromIndex: number, toIndex: number) => {
    const newSections = [...curriculumSections];
    const [movedSection] = newSections.splice(fromIndex, 1);
    newSections.splice(toIndex, 0, movedSection);
    
    // Update order
    newSections.forEach((section, index) => {
      section.order = index;
    });
    
    setCurriculumSections(newSections);
  };

  const getObjectiveIcon = (type: string) => {
    switch (type) {
      case 'knowledge': return <BookOpen className="h-4 w-4" />;
      case 'skill': return <Target className="h-4 w-4" />;
      case 'attitude': return <Users className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const calculateTotalDuration = () => {
    return curriculumSections.reduce((total, section) => total + section.estimatedDuration, 0);
  };

  const calculateCompletionRate = () => {
    const totalObjectives = curriculumSections.reduce((total, section) => total + section.objectives.length, 0);
    const completedObjectives = curriculumSections.reduce((total, section) => 
      total + section.objectives.filter(obj => obj.completed).length, 0
    );
    return totalObjectives > 0 ? Math.round((completedObjectives / totalObjectives) * 100) : 0;
  };

  const saveCurriculum = async () => {
    try {
      setLoading(true);
      // In a real app, this would save to the backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      onSave(curriculumSections);
    } catch (error) {
      console.error('Error saving curriculum:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <Calendar className="h-6 w-6 text-green-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Curriculum Planner</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Plan and organize your course structure
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('overview')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  viewMode === 'overview' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  viewMode === 'timeline' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Timeline
              </button>
              <button
                onClick={() => setViewMode('objectives')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  viewMode === 'objectives' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Objectives
              </button>
            </div>
            <button
              onClick={saveCurriculum}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Curriculum'}
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
          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {/* Course Overview */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Course Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <BookOpen className="h-6 w-6 text-blue-600" />
                      <div>
                        <div className="text-2xl font-bold text-blue-600">{curriculumSections.length}</div>
                        <div className="text-sm text-blue-600">Modules</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Clock className="h-6 w-6 text-green-600" />
                      <div>
                        <div className="text-2xl font-bold text-green-600">{formatDuration(calculateTotalDuration())}</div>
                        <div className="text-sm text-green-600">Total Duration</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Target className="h-6 w-6 text-purple-600" />
                      <div>
                        <div className="text-2xl font-bold text-purple-600">
                          {curriculumSections.reduce((total, section) => total + section.objectives.length, 0)}
                        </div>
                        <div className="text-sm text-purple-600">Learning Objectives</div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="h-6 w-6 text-orange-600" />
                      <div>
                        <div className="text-2xl font-bold text-orange-600">{calculateCompletionRate()}%</div>
                        <div className="text-sm text-orange-600">Completion Rate</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Curriculum Sections */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Curriculum Modules</h3>
                  <button
                    onClick={addSection}
                    className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Module
                  </button>
                </div>

                {curriculumSections.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No modules yet</h4>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      Start planning your curriculum by adding modules
                    </p>
                    <button
                      onClick={addSection}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Module
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {curriculumSections.map((section, index) => (
                      <div key={section.id} className="border border-gray-200 dark:border-gray-600 rounded-lg">
                        {/* Section Header */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700">
                          <div className="flex items-center space-x-3">
                            <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                Module {index + 1}
                              </span>
                              <input
                                type="text"
                                value={section.title}
                                onChange={(e) => updateSection(section.id, { title: e.target.value })}
                                className="font-medium text-gray-900 dark:text-white bg-transparent border-none focus:ring-0 focus:outline-none"
                              />
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                              <Clock className="h-4 w-4" />
                              <span>{formatDuration(section.estimatedDuration)}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                              <Target className="h-4 w-4" />
                              <span>{section.objectives.length} objectives</span>
                            </div>
                            <button
                              onClick={() => addObjective(section.id)}
                              className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => updateSection(section.id, { isExpanded: !section.isExpanded })}
                              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              {section.isExpanded ? (
                                <ArrowUp className="h-4 w-4" />
                              ) : (
                                <ArrowDown className="h-4 w-4" />
                              )}
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
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Module Description
                              </label>
                              <textarea
                                value={section.description}
                                onChange={(e) => updateSection(section.id, { description: e.target.value })}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                placeholder="Describe what students will learn in this module..."
                              />
                            </div>

                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Estimated Duration (minutes)
                              </label>
                              <input
                                type="number"
                                value={section.estimatedDuration}
                                onChange={(e) => updateSection(section.id, { estimatedDuration: parseInt(e.target.value) || 0 })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                min="0"
                              />
                            </div>

                            {/* Learning Objectives */}
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium text-gray-900 dark:text-white">Learning Objectives</h4>
                                <button
                                  onClick={() => addObjective(section.id)}
                                  className="flex items-center px-2 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Add Objective
                                </button>
                              </div>
                              
                              <div className="space-y-2">
                                {section.objectives.map(objective => (
                                  <div
                                    key={objective.id}
                                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                                  >
                                    <div className="flex items-center space-x-3">
                                      {getObjectiveIcon(objective.type)}
                                      <div className="flex-1">
                                        <div className="font-medium text-gray-900 dark:text-white">
                                          {objective.title}
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-300">
                                          {objective.description}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <span className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(objective.difficulty)}`}>
                                        {objective.difficulty}
                                      </span>
                                      <button
                                        onClick={() => {
                                          setEditingObjective(objective);
                                          setShowObjectiveModal(true);
                                        }}
                                        className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                                      >
                                        <Edit3 className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => deleteObjective(section.id, objective.id)}
                                        className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                                
                                {section.objectives.length === 0 && (
                                  <div className="text-center py-6">
                                    <Target className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                      No learning objectives defined
                                    </p>
                                  </div>
                                )}
                              </div>
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
        </div>

        {/* Learning Objective Modal */}
        {showObjectiveModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {editingObjective ? 'Edit Learning Objective' : 'Add Learning Objective'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowObjectiveModal(false);
                      setEditingObjective(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Objective Title
                    </label>
                    <input
                      type="text"
                      value={editingObjective?.title || ''}
                      onChange={(e) => setEditingObjective(prev => prev ? { ...prev, title: e.target.value } : null)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Enter objective title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      value={editingObjective?.description || ''}
                      onChange={(e) => setEditingObjective(prev => prev ? { ...prev, description: e.target.value } : null)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Describe the learning objective..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Type
                      </label>
                      <select
                        value={editingObjective?.type || 'knowledge'}
                        onChange={(e) => setEditingObjective(prev => prev ? { ...prev, type: e.target.value as any } : null)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      >
                        <option value="knowledge">Knowledge</option>
                        <option value="skill">Skill</option>
                        <option value="attitude">Attitude</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Difficulty
                      </label>
                      <select
                        value={editingObjective?.difficulty || 'beginner'}
                        onChange={(e) => setEditingObjective(prev => prev ? { ...prev, difficulty: e.target.value as any } : null)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => {
                        if (editingObjective && selectedSection) {
                          updateObjective(selectedSection, editingObjective.id, editingObjective);
                        }
                        setShowObjectiveModal(false);
                        setEditingObjective(null);
                      }}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Save Objective
                    </button>
                    <button
                      onClick={() => {
                        setShowObjectiveModal(false);
                        setEditingObjective(null);
                      }}
                      className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                    >
                      Cancel
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