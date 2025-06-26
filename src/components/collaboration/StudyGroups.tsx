import React, { useState, useEffect } from 'react';
import { BackButton } from '../common/BackButton';
import { 
  Users, 
  Plus, 
  Search, 
  MessageCircle, 
  Calendar, 
  MapPin, 
  BookOpen,
  UserPlus,
  Settings,
  Video,
  FileText,
  Star,
  Clock,
  X,
  CheckCircle,
  AlertCircle,
  GraduationCap,
  Mail,
  Phone,
  Globe,
  Filter,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { apiService } from '../../services/api';
import { MessagingPanel } from '../messaging/MessagingPanel';

interface StudyGroup {
  id: string;
  name: string;
  description: string;
  courseId: string;
  courseName: string;
  creatorId: string;
  creatorName: string;
  members: StudyGroupMember[];
  maxMembers: number;
  isPrivate: boolean;
  meetingSchedule: string;
  location: string;
  tags: string[];
  createdAt: string;
  lastActivity: string;
}

interface StudyGroupMember {
  id: string;
  name: string;
  role: 'creator' | 'admin' | 'member';
  joinedAt: string;
  isOnline: boolean;
}

interface Person {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
  avatar?: string;
  bio?: string;
  courses?: Course[];
  enrolledCourses?: Course[];
  isOnline: boolean;
  lastSeen: string;
  skills?: string[];
  location?: string;
  joinedAt: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  enrollments?: number;
}

interface StudyGroupProps {
  courseId?: string;
}

export const StudyGroups: React.FC<StudyGroupProps> = ({ courseId }) => {
  const { user } = useAuthStore();
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [myGroups, setMyGroups] = useState<StudyGroup[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [teachers, setTeachers] = useState<Person[]>([]);
  const [students, setStudents] = useState<Person[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'groups' | 'students' | 'teachers'>('groups');
  const [showMessaging, setShowMessaging] = useState(false);
  const [messagingRecipient, setMessagingRecipient] = useState<string>('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'recent' | 'courses'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    loadData();
  }, [courseId]);

  const loadData = async () => {
    try {
      // Mock data for demo - replace with actual API calls
      const mockGroups: StudyGroup[] = [
        {
          id: '1',
          name: 'React Study Group',
          description: 'Weekly study sessions for React fundamentals and advanced concepts',
          courseId: '1',
          courseName: 'React Fundamentals',
          creatorId: 'user1',
          creatorName: 'John Doe',
          members: [
            { id: 'user1', name: 'John Doe', role: 'creator', joinedAt: '2024-01-01', isOnline: true },
            { id: 'user2', name: 'Jane Smith', role: 'member', joinedAt: '2024-01-02', isOnline: false },
            { id: 'user3', name: 'Bob Johnson', role: 'member', joinedAt: '2024-01-03', isOnline: true }
          ],
          maxMembers: 10,
          isPrivate: false,
          meetingSchedule: 'Every Tuesday at 7 PM',
          location: 'Online (Zoom)',
          tags: ['react', 'javascript', 'frontend'],
          createdAt: '2024-01-01',
          lastActivity: '2024-01-15'
        },
        {
          id: '2',
          name: 'JavaScript Masters',
          description: 'Advanced JavaScript concepts and best practices',
          courseId: '2',
          courseName: 'JavaScript Advanced',
          creatorId: 'user4',
          creatorName: 'Alice Brown',
          members: [
            { id: 'user4', name: 'Alice Brown', role: 'creator', joinedAt: '2024-01-01', isOnline: true },
            { id: 'user5', name: 'Charlie Wilson', role: 'admin', joinedAt: '2024-01-02', isOnline: true }
          ],
          maxMembers: 8,
          isPrivate: true,
          meetingSchedule: 'Every Thursday at 6 PM',
          location: 'Campus Library',
          tags: ['javascript', 'advanced', 'es6'],
          createdAt: '2024-01-01',
          lastActivity: '2024-01-14'
        }
      ];

      const mockPeople: Person[] = [
        {
          id: 'user1',
          name: 'John Doe',
          email: 'john.doe@example.com',
          role: 'STUDENT',
          bio: 'Passionate about web development and React',
          enrolledCourses: [
            { id: '1', title: 'React Fundamentals', description: 'Learn React basics', enrollments: 150 },
            { id: '2', title: 'JavaScript Advanced', description: 'Advanced JS concepts', enrollments: 89 }
          ],
          isOnline: true,
          lastSeen: new Date().toISOString(),
          skills: ['React', 'JavaScript', 'HTML', 'CSS'],
          location: 'New York, NY',
          joinedAt: '2024-01-01'
        },
        {
          id: 'user2',
          name: 'Jane Smith',
          email: 'jane.smith@example.com',
          role: 'STUDENT',
          bio: 'Full-stack developer in training',
          enrolledCourses: [
            { id: '1', title: 'React Fundamentals', description: 'Learn React basics', enrollments: 150 }
          ],
          isOnline: false,
          lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          skills: ['Python', 'Django', 'JavaScript'],
          location: 'San Francisco, CA',
          joinedAt: '2024-01-02'
        },
        {
          id: 'teacher1',
          name: 'Dr. Sarah Johnson',
          email: 'sarah.johnson@example.com',
          role: 'TEACHER',
          bio: 'Senior Software Engineer with 10+ years of experience in web development',
          courses: [
            { id: '1', title: 'React Fundamentals', description: 'Learn React basics', enrollments: 150 },
            { id: '3', title: 'Node.js Backend', description: 'Server-side development', enrollments: 95 }
          ],
          isOnline: true,
          lastSeen: new Date().toISOString(),
          skills: ['React', 'Node.js', 'TypeScript', 'MongoDB'],
          location: 'Boston, MA',
          joinedAt: '2023-06-01'
        },
        {
          id: 'teacher2',
          name: 'Prof. Michael Chen',
          email: 'michael.chen@example.com',
          role: 'TEACHER',
          bio: 'Computer Science professor specializing in algorithms and data structures',
          courses: [
            { id: '2', title: 'JavaScript Advanced', description: 'Advanced JS concepts', enrollments: 89 },
            { id: '4', title: 'Data Structures', description: 'Learn fundamental data structures', enrollments: 120 }
          ],
          isOnline: false,
          lastSeen: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          skills: ['JavaScript', 'Python', 'Algorithms', 'Data Structures'],
          location: 'Seattle, WA',
          joinedAt: '2023-08-15'
        }
      ];

      setGroups(mockGroups);
      setMyGroups(mockGroups.filter(group => 
        group.members.some(member => member.id === user?.id)
      ));
      
      setPeople(mockPeople);
      setTeachers(mockPeople.filter(p => p.role === 'TEACHER'));
      setStudents(mockPeople.filter(p => p.role === 'STUDENT'));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    try {
      console.log('Joining group:', groupId);
      setShowJoinModal(false);
    } catch (error) {
      console.error('Error joining group:', error);
    }
  };

  const handleCreateGroup = async (groupData: any) => {
    try {
      console.log('Creating group:', groupData);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  const handleMessagePerson = (personId: string) => {
    setMessagingRecipient(personId);
    setShowMessaging(true);
  };

  const isMember = (group: StudyGroup) => {
    return group.members.some(member => member.id === user?.id);
  };

  const isCreator = (group: StudyGroup) => {
    return group.creatorId === user?.id;
  };

  const filteredPeople = () => {
    let filtered = activeTab === 'teachers' ? teachers : students;
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(person =>
        person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.skills?.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Filter by role
    if (filterRole !== 'all') {
      filtered = filtered.filter(person => person.role === filterRole);
    }
    
    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'recent':
          comparison = new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
          break;
        case 'courses':
          const aCourses = a.courses?.length || a.enrolledCourses?.length || 0;
          const bCourses = b.courses?.length || b.enrolledCourses?.length || 0;
          comparison = bCourses - aCourses;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  };

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <BackButton showHome />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">People & Groups</h2>
            <p className="text-gray-600 dark:text-gray-300">
              Connect with peers, find teachers, and join study groups
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowJoinModal(true)}
            className="flex items-center px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Join Group
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Group
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('groups')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'groups'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Study Groups ({groups.length})
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'students'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Students ({students.length})
          </button>
          <button
            onClick={() => setActiveTab('teachers')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'teachers'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Teachers ({teachers.length})
          </button>
        </nav>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>
        
        {activeTab !== 'groups' && (
          <div className="flex gap-2">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Roles</option>
              <option value="STUDENT">Students</option>
              <option value="TEACHER">Teachers</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'recent' | 'courses')}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="name">Sort by Name</option>
              <option value="recent">Sort by Recent</option>
              <option value="courses">Sort by Courses</option>
            </select>
            
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {activeTab === 'groups' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map(group => (
            <div
              key={group.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    {group.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    {group.description}
                  </p>
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <BookOpen className="h-3 w-3 mr-1" />
                    {group.courseName}
                  </div>
                </div>
                {group.isPrivate && (
                  <div className="flex items-center px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded text-xs">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Private
                  </div>
                )}
              </div>

              {/* Members */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Members ({group.members.length}/{group.maxMembers})
                  </span>
                  <div className="flex -space-x-2">
                    {group.members.slice(0, 3).map(member => (
                      <div
                        key={member.id}
                        className={`w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs font-medium ${
                          member.isOnline ? 'bg-green-500 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                        }`}
                        title={member.name}
                      >
                        {member.name.charAt(0)}
                      </div>
                    ))}
                    {group.members.length > 3 && (
                      <div className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs text-gray-600 dark:text-gray-400">
                        +{group.members.length - 3}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Meeting Info */}
              <div className="mb-4 space-y-2">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <Calendar className="h-4 w-4 mr-2" />
                  {group.meetingSchedule}
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <MapPin className="h-4 w-4 mr-2" />
                  {group.location}
                </div>
              </div>

              {/* Tags */}
              <div className="mb-4">
                <div className="flex flex-wrap gap-1">
                  {group.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                {isMember(group) ? (
                  <>
                    <button
                      onClick={() => setSelectedGroup(group)}
                      className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Open Chat
                    </button>
                    {isCreator(group) && (
                      <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <Settings className="h-4 w-4" />
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => handleJoinGroup(group.id)}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    Join Group
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPeople().map(person => (
            <div
              key={person.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-lg">
                        {person.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${
                      person.isOnline ? 'bg-green-500' : 'bg-gray-400'
                    }`}></div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {person.name}
                    </h3>
                    <div className="flex items-center space-x-2">
                      {person.role === 'TEACHER' ? (
                        <GraduationCap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
                      )}
                      <span className="text-sm text-gray-600 dark:text-gray-300 capitalize">
                        {person.role.toLowerCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {person.bio && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                  {person.bio}
                </p>
              )}

              {/* Courses */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  {person.role === 'TEACHER' ? 'Teaching' : 'Enrolled in'} ({person.courses?.length || person.enrolledCourses?.length || 0})
                </h4>
                <div className="space-y-2">
                  {(person.courses || person.enrolledCourses || []).slice(0, 2).map(course => (
                    <div key={course.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {course.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {course.enrollments} students
                        </p>
                      </div>
                    </div>
                  ))}
                  {(person.courses?.length || person.enrolledCourses?.length || 0) > 2 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      +{(person.courses?.length || person.enrolledCourses?.length || 0) - 2} more
                    </p>
                  )}
                </div>
              </div>

              {/* Skills */}
              {person.skills && person.skills.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-1">
                    {person.skills.slice(0, 3).map(skill => (
                      <span
                        key={skill}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                      >
                        {skill}
                      </span>
                    ))}
                    {person.skills.length > 3 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        +{person.skills.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Location and Status */}
              <div className="mb-4 space-y-1">
                {person.location && (
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <MapPin className="h-3 w-3 mr-1" />
                    {person.location}
                  </div>
                )}
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                  <Clock className="h-3 w-3 mr-1" />
                  {person.isOnline ? 'Online now' : `Last seen ${new Date(person.lastSeen).toLocaleDateString()}`}
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={() => handleMessagePerson(person.id)}
                  className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Message
                </button>
                <button
                  onClick={() => setSelectedPerson(person)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                >
                  View Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredGroups.length === 0 && activeTab === 'groups' && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No study groups found
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            {searchTerm ? 'Try adjusting your search terms' : 'Create the first study group for this course!'}
          </p>
        </div>
      )}

      {filteredPeople().length === 0 && activeTab !== 'groups' && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No {activeTab} found
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            {searchTerm ? 'Try adjusting your search terms' : `No ${activeTab} available yet.`}
          </p>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create Study Group</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Group Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Enter group name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Describe your study group"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Meeting Schedule
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., Every Tuesday at 7 PM"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., Online (Zoom) or Campus Library"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max Members
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="20"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    defaultValue="10"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="private-group"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="private-group" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Private group (requires approval to join)
                  </label>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Group
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showJoinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Join Study Group</h3>
                <button
                  onClick={() => setShowJoinModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Group Code or Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Enter group code or search by name"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowJoinModal(false)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Join Group
                  </button>
                  <button
                    onClick={() => setShowJoinModal(false)}
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

      {/* Messaging Panel */}
      {showMessaging && (
        <MessagingPanel 
          isOpen={showMessaging}
          onClose={() => setShowMessaging(false)}
          type="messages"
          courseId=""
        />
      )}
    </div>
  );
}; 