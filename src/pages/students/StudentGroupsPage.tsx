import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  UserPlus,
  UserMinus,
  Mail,
  BarChart3,
  X,
  Check
} from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { useNotification } from '../../hooks/useNotification';
import { getStudents, getMyCourses } from '../../services/api';
import { getInitials } from '../../lib/utils';

interface StudentGroup {
  id: string;
  name: string;
  description: string;
  courseId: string | null;
  studentIds: string[];
  createdAt: string;
  updatedAt: string;
}

export const StudentGroupsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();
  
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<StudentGroup | null>(null);
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    courseId: null as string | null,
    studentIds: [] as string[]
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterGroups();
  }, [groups, searchQuery, selectedCourse]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [studentsData, coursesData] = await Promise.all([
        getStudents(),
        getMyCourses()
      ]);
      setStudents(studentsData);
      setCourses(coursesData);
      loadGroups();
    } catch (error) {
      console.error('Error loading data:', error);
      showError('Failed to Load Data', 'Unable to load students and courses. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadGroups = () => {
    try {
      const stored = localStorage.getItem(`student-groups-${user?.id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setGroups(parsed);
      } else {
        setGroups([]);
      }
    } catch (error) {
      console.error('Error loading groups:', error);
      setGroups([]);
    }
  };

  const saveGroups = (groupsToSave: StudentGroup[]) => {
    try {
      localStorage.setItem(`student-groups-${user?.id}`, JSON.stringify(groupsToSave));
      setGroups(groupsToSave);
    } catch (error) {
      console.error('Error saving groups:', error);
      showError('Failed to Save Group', 'Unable to save group. Please try again.');
    }
  };

  const [filteredGroups, setFilteredGroups] = useState<StudentGroup[]>([]);

  const filterGroups = () => {
    let filtered = [...groups];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(group =>
        group.name.toLowerCase().includes(query) ||
        group.description.toLowerCase().includes(query)
      );
    }

    if (selectedCourse !== 'all') {
      filtered = filtered.filter(group => group.courseId === selectedCourse);
    }

    setFilteredGroups(filtered);
  };

  const handleCreateGroup = () => {
    if (!newGroup.name.trim()) {
      showError('Missing Name', 'Please enter a group name.');
      return;
    }

    const group: StudentGroup = {
      id: Date.now().toString(),
      name: newGroup.name,
      description: newGroup.description,
      courseId: newGroup.courseId,
      studentIds: newGroup.studentIds,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    saveGroups([...groups, group]);
    setNewGroup({
      name: '',
      description: '',
      courseId: null,
      studentIds: []
    });
    setShowCreateModal(false);
    showSuccess('Group Created', 'Your student group has been created successfully.');
  };

  const handleUpdateGroup = () => {
    if (!showEditModal || !showEditModal.name.trim()) {
      showError('Missing Name', 'Please enter a group name.');
      return;
    }

    const updated = groups.map(g =>
      g.id === showEditModal.id
        ? { ...g, ...newGroup, updatedAt: new Date().toISOString() }
        : g
    );

    saveGroups(updated);
    setShowEditModal(null);
    setNewGroup({
      name: '',
      description: '',
      courseId: null,
      studentIds: []
    });
    showSuccess('Group Updated', 'The group has been updated successfully.');
  };

  const handleDeleteGroup = (groupId: string) => {
    if (window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      const updated = groups.filter(g => g.id !== groupId);
      saveGroups(updated);
      showSuccess('Group Deleted', 'The group has been deleted successfully.');
    }
  };

  const toggleStudentInGroup = (studentId: string) => {
    if (newGroup.studentIds.includes(studentId)) {
      setNewGroup(prev => ({
        ...prev,
        studentIds: prev.studentIds.filter(id => id !== studentId)
      }));
    } else {
      setNewGroup(prev => ({
        ...prev,
        studentIds: [...prev.studentIds, studentId]
      }));
    }
  };

  const openEditModal = (group: StudentGroup) => {
    setShowEditModal(group);
    setNewGroup({
      name: group.name,
      description: group.description,
      courseId: group.courseId,
      studentIds: [...group.studentIds]
    });
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setShowEditModal(null);
    setNewGroup({
      name: '',
      description: '',
      courseId: null,
      studentIds: []
    });
  };

  const handleSendMessageToGroup = (group: StudentGroup) => {
    const studentEmails = students
      .filter(s => group.studentIds.includes(s.id))
      .map(s => s.email || s.id)
      .join(',');
    navigate(`/messages?to=${encodeURIComponent(studentEmails)}`);
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
                <Users className="w-8 h-8 mr-3 text-blue-600 dark:text-blue-400" />
                Student Groups
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Organize students into groups for easier management
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Group
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search groups..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Courses</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Groups Grid */}
        {filteredGroups.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg">
            <Users className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No groups found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {groups.length === 0
                ? 'Create your first student group to organize students.'
                : 'Try adjusting your search or filters.'}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="w-5 h-5 inline mr-2" />
              Create First Group
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroups.map(group => {
              const groupStudents = students.filter(s => group.studentIds.includes(s.id));
              const course = group.courseId ? courses.find(c => c.id === group.courseId) : null;

              return (
                <div
                  key={group.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow hover-lift"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {group.name}
                      </h3>
                      {course && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {course.title}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => openEditModal(group)}
                        className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                        title="Edit group"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteGroup(group.id)}
                        className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                        title="Delete group"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {group.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                      {group.description}
                    </p>
                  )}

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Students ({groupStudents.length})
                      </span>
                      <button
                        onClick={() => handleSendMessageToGroup(group)}
                        className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                      >
                        <Mail className="w-3 h-3 mr-1" />
                        Message
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {groupStudents.slice(0, 5).map(student => (
                        <div
                          key={student.id}
                          className="flex items-center space-x-2 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg"
                        >
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
                            {getInitials(student.name || student.email || 'U')}
                          </div>
                          <span className="text-xs text-gray-700 dark:text-gray-300 truncate max-w-[100px]">
                            {student.name || student.email}
                          </span>
                        </div>
                      ))}
                      {groupStudents.length > 5 && (
                        <div className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs text-gray-700 dark:text-gray-300">
                          +{groupStudents.length - 5} more
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>Created {new Date(group.createdAt).toLocaleDateString()}</span>
                    <button
                      onClick={() => navigate(`/students/progress?groupId=${group.id}`)}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                    >
                      <BarChart3 className="w-3 h-3 mr-1" />
                      View Progress
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create/Edit Modal */}
        {(showCreateModal || showEditModal) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {showEditModal ? 'Edit Group' : 'Create Group'}
                  </h3>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Group Name *
                    </label>
                    <input
                      type="text"
                      value={newGroup.name}
                      onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Enter group name..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={newGroup.description}
                      onChange={(e) => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Enter group description..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Course (Optional)
                    </label>
                    <select
                      value={newGroup.courseId || ''}
                      onChange={(e) => setNewGroup(prev => ({ ...prev, courseId: e.target.value || null }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">No specific course</option>
                      {courses.map(course => (
                        <option key={course.id} value={course.id}>
                          {course.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Select Students ({newGroup.studentIds.length} selected)
                    </label>
                    <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 max-h-64 overflow-y-auto">
                      {students.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">No students available</p>
                      ) : (
                        <div className="space-y-2">
                          {students.map(student => {
                            const isSelected = newGroup.studentIds.includes(student.id);
                            return (
                              <button
                                key={student.id}
                                onClick={() => toggleStudentInGroup(student.id)}
                                className={`w-full flex items-center space-x-3 p-2 rounded-lg transition-colors ${
                                  isSelected
                                    ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500'
                                    : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border-2 border-transparent'
                                }`}
                              >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                                  isSelected
                                    ? 'bg-blue-600'
                                    : 'bg-gray-400'
                                }`}>
                                  {getInitials(student.name || student.email || 'U')}
                                </div>
                                <div className="flex-1 text-left">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {student.name || student.email}
                                  </p>
                                  {student.email && student.name && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {student.email}
                                    </p>
                                  )}
                                </div>
                                {isSelected && (
                                  <Check className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      onClick={closeModal}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={showEditModal ? handleUpdateGroup : handleCreateGroup}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                      {showEditModal ? 'Update' : 'Create'} Group
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

