import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Square, 
  Plus, 
  Trash2, 
  Edit3, 
  Calendar,
  Clock,
  Flag,
  Star,
  Search,
  Tag,
  AlertCircle,
  CheckCircle,
  Clock as ClockIcon,
  X,
  Check
} from 'lucide-react';
import { useAuthStore } from '../../store/auth';

interface TodoItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  category: string;
  tags: string[];
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  estimatedTime?: number; // in minutes
  actualTime?: number; // in minutes
  notes?: string;
  relatedEventId?: string;
}

interface TodoListProps {
  selectedDate?: Date;
  onTodosChange?: (todos: TodoItem[]) => void;
}

export const TodoList: React.FC<TodoListProps> = ({
  selectedDate,
  onTodosChange
}) => {
  const { user } = useAuthStore();
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [filteredTodos, setFilteredTodos] = useState<TodoItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterCategory] = useState<string>('all');
  const [sortBy] = useState<'dueDate' | 'priority' | 'createdAt' | 'title'>('dueDate');
  const [sortOrder] = useState<'asc' | 'desc'>('asc');
  const [loading, setLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDueDate, setTempDueDate] = useState('');
  const [tempDueTime, setTempDueTime] = useState('');
  const [durationHours, setDurationHours] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');

  const categories = ['Study', 'Assignment', 'Project', 'Meeting', 'Personal', 'Work'];
  const priorities = ['low', 'medium', 'high', 'urgent'];

  useEffect(() => {
    loadTodos();
  }, []);

  useEffect(() => {
    filterAndSortTodos();
  }, [todos, searchTerm, filterStatus, filterPriority, filterCategory, sortBy, sortOrder, selectedDate]);

  // Notify parent component when todos change
  useEffect(() => {
    onTodosChange?.(todos);
  }, [todos, onTodosChange]);

  // Initialize duration fields when editing a todo
  useEffect(() => {
    if (editingTodo?.estimatedTime) {
      const { hours, minutes } = convertMinutesToDuration(editingTodo.estimatedTime);
      setDurationHours(hours);
      setDurationMinutes(minutes);
    } else {
      setDurationHours('');
      setDurationMinutes('');
    }
  }, [editingTodo]);

  const loadTodos = async () => {
    try {
      // Mock data for demo - replace with actual API calls
      const mockTodos: TodoItem[] = [
        {
          id: '1',
          title: 'Complete React Assignment',
          description: 'Finish the component library project for React Fundamentals course',
          completed: false,
          priority: 'high',
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          category: 'Assignment',
          tags: ['react', 'frontend', 'project'],
          assignedTo: user?.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          estimatedTime: 120,
          notes: 'Need to implement responsive design and add unit tests'
        },
        {
          id: '2',
          title: 'Study for JavaScript Quiz',
          description: 'Review ES6 features and async programming concepts',
          completed: false,
          priority: 'medium',
          dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          category: 'Study',
          tags: ['javascript', 'quiz', 'es6'],
          assignedTo: user?.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          estimatedTime: 60
        },
        {
          id: '3',
          title: 'Team Study Session',
          description: 'Weekly group study session for advanced topics',
          completed: true,
          priority: 'low',
          dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          category: 'Meeting',
          tags: ['study-group', 'collaboration'],
          assignedTo: user?.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          estimatedTime: 90,
          actualTime: 85
        },
        {
          id: '4',
          title: 'Prepare Presentation',
          description: 'Create slides for the final project presentation',
          completed: false,
          priority: 'urgent',
          dueDate: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
          category: 'Project',
          tags: ['presentation', 'final-project'],
          assignedTo: user?.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          estimatedTime: 180
        }
      ];

      setTodos(mockTodos);
    } catch (error) {
      console.error('Error loading todos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortTodos = () => {
    let filtered = [...todos];

    // Filter by selected date
    if (selectedDate) {
      filtered = filtered.filter(todo => {
        if (!todo.dueDate) return false;
        const todoDate = new Date(todo.dueDate);
        return todoDate.toDateString() === selectedDate.toDateString();
      });
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(todo =>
        todo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        todo.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        todo.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(todo => 
        filterStatus === 'completed' ? todo.completed : !todo.completed
      );
    }

    // Filter by priority
    if (filterPriority !== 'all') {
      filtered = filtered.filter(todo => todo.priority === filterPriority);
    }

    // Filter by category
    if (filterCategory !== 'all') {
      filtered = filtered.filter(todo => todo.category === filterCategory);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) comparison = 0;
          else if (!a.dueDate) comparison = 1;
          else if (!b.dueDate) comparison = -1;
          else comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredTodos(filtered);
  };

  const toggleTodo = async (todoId: string) => {
    setTodos(prev => prev.map(todo => 
      todo.id === todoId 
        ? { ...todo, completed: !todo.completed, updatedAt: new Date().toISOString() }
        : todo
    ));
  };

  const deleteTodo = async (todoId: string) => {
    setTodos(prev => prev.filter(todo => todo.id !== todoId));
  };

  const addTodo = async (todoData: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTodo: TodoItem = {
      ...todoData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setTodos(prev => [...prev, newTodo]);
    setShowAddModal(false);
  };

  const updateTodo = async (todoId: string, updates: Partial<TodoItem>) => {
    setTodos(prev => prev.map(todo => 
      todo.id === todoId 
        ? { ...todo, ...updates, updatedAt: new Date().toISOString() }
        : todo
    ));
    setEditingTodo(null);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900';
      case 'high': return 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900';
      case 'low': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertCircle className="h-4 w-4" />;
      case 'high': return <Flag className="h-4 w-4" />;
      case 'medium': return <ClockIcon className="h-4 w-4" />;
      case 'low': return <CheckCircle className="h-4 w-4" />;
      default: return <Star className="h-4 w-4" />;
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getDueDateStatus = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { status: 'overdue', color: 'text-red-600 dark:text-red-400' };
    if (diffDays === 0) return { status: 'due-today', color: 'text-orange-600 dark:text-orange-400' };
    if (diffDays <= 1) return { status: 'due-tomorrow', color: 'text-yellow-600 dark:text-yellow-400' };
    return { status: 'upcoming', color: 'text-green-600 dark:text-green-400' };
  };

  const handleDatePickerDone = () => {
    const combinedDateTime = tempDueDate && tempDueTime ? `${tempDueDate}T${tempDueTime}` : '';
    const form = document.querySelector('form') as HTMLFormElement;
    if (form) {
      const dueDateInput = form.querySelector('input[name="dueDate"]') as HTMLInputElement;
      if (dueDateInput) {
        dueDateInput.value = combinedDateTime;
      }
    }
    setShowDatePicker(false);
  };

  const openDatePicker = (currentValue?: string) => {
    if (currentValue) {
      const [date, time] = currentValue.split('T');
      setTempDueDate(date || '');
      setTempDueTime(time || '');
    } else {
      setTempDueDate('');
      setTempDueTime('');
    }
    setShowDatePicker(true);
  };

  const convertDurationToMinutes = (hours: string, minutes: string): number | undefined => {
    const hoursNum = parseInt(hours) || 0;
    const minutesNum = parseInt(minutes) || 0;
    const totalMinutes = hoursNum * 60 + minutesNum;
    return totalMinutes > 0 ? totalMinutes : undefined;
  };

  const convertMinutesToDuration = (totalMinutes: number | undefined) => {
    if (!totalMinutes) return { hours: '', minutes: '' };
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return { hours: hours.toString(), minutes: minutes.toString() };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">To-Do List</h3>
          <p className="text-xs text-gray-600 dark:text-gray-300">
            {selectedDate ? `Tasks for ${selectedDate.toLocaleDateString()}` : 'All your tasks'}
          </p>
        </div>
        <button
          onClick={() => {
            setShowAddModal(true);
            setEditingTodo(null);
            setDurationHours('');
            setDurationMinutes('');
          }}
          className="flex items-center px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add
        </button>
      </div>

      {/* Simple Search */}
      <div className="mb-3">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      {/* Simple Filter */}
      <div className="flex gap-1 mb-3">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as 'all' | 'pending' | 'completed')}
          className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="completed">Done</option>
        </select>
        
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
        >
          <option value="all">All Priority</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Todo List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredTodos.length > 0 ? (
          filteredTodos.map(todo => (
            <div
              key={todo.id}
              className={`bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 p-2 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${
                todo.completed ? 'opacity-75' : ''
              }`}
            >
              <div className="flex items-start space-x-2">
                {/* Checkbox */}
                <button
                  onClick={() => toggleTodo(todo.id)}
                  className="flex-shrink-0 mt-0.5"
                >
                  {todo.completed ? (
                    <CheckSquare className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <Square className="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className={`text-sm font-medium text-gray-900 dark:text-white ${
                        todo.completed ? 'line-through' : ''
                      }`}>
                        {todo.title}
                      </h4>
                      {todo.description && (
                        <p className={`text-xs text-gray-600 dark:text-gray-300 mt-0.5 line-clamp-1 ${
                          todo.completed ? 'line-through' : ''
                        }`}>
                          {todo.description}
                        </p>
                      )}
                    </div>
                    
                    {/* Priority Badge */}
                    <div className={`flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${getPriorityColor(todo.priority)}`}>
                      {getPriorityIcon(todo.priority)}
                      <span className="ml-1 capitalize text-xs">{todo.priority}</span>
                    </div>
                  </div>

                  {/* Meta Information */}
                  <div className="flex items-center space-x-3 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                    {/* Category */}
                    <div className="flex items-center">
                      <Tag className="h-3 w-3 mr-1" />
                      {todo.category}
                    </div>

                    {/* Due Date */}
                    {todo.dueDate && (
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span className={getDueDateStatus(todo.dueDate).color}>
                          {new Date(todo.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    {/* Estimated Time */}
                    {todo.estimatedTime && (
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatTime(todo.estimatedTime)}
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {todo.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {todo.tags.slice(0, 2).map(tag => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs"
                        >
                          #{tag}
                        </span>
                      ))}
                      {todo.tags.length > 2 && (
                        <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded text-xs">
                          +{todo.tags.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setEditingTodo(todo)}
                    className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <Edit3 className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="p-0.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <CheckSquare className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
              No tasks found
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              {searchTerm ? 'Try adjusting your search' : 'Add your first task!'}
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Todo Modal */}
      {(showAddModal || editingTodo) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm w-full mx-4">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  {editingTodo ? 'Edit Task' : 'Add New Task'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingTodo(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form className="space-y-3" onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const todoData = {
                  title: formData.get('title') as string,
                  description: formData.get('description') as string,
                  completed: editingTodo?.completed || false,
                  priority: formData.get('priority') as 'low' | 'medium' | 'high' | 'urgent',
                  dueDate: formData.get('dueDate') as string,
                  category: formData.get('category') as string,
                  tags: (formData.get('tags') as string).split(',').map(t => t.trim()).filter(Boolean),
                  estimatedTime: convertDurationToMinutes(durationHours, durationMinutes),
                  notes: formData.get('notes') as string,
                  assignedTo: user?.id
                };

                if (editingTodo) {
                  updateTodo(editingTodo.id, todoData);
                } else {
                  addTodo(todoData);
                }
                
                // Reset duration fields
                setDurationHours('');
                setDurationMinutes('');
              }}>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    defaultValue={editingTodo?.title}
                    required
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Enter task title"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows={2}
                    defaultValue={editingTodo?.description}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Enter task description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Priority
                    </label>
                    <select
                      name="priority"
                      defaultValue={editingTodo?.priority || 'medium'}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      {priorities.map(priority => (
                        <option key={priority} value={priority} className="capitalize">
                          {priority}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Category
                    </label>
                    <select
                      name="category"
                      defaultValue={editingTodo?.category || 'Study'}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Due Date
                    </label>
                    <div className="relative">
                      <input
                        type="datetime-local"
                        name="dueDate"
                        defaultValue={editingTodo?.dueDate}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        style={{ display: 'none' }}
                      />
                      <button
                        type="button"
                        onClick={() => openDatePicker(editingTodo?.dueDate)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-left flex items-center justify-between"
                      >
                        <span className={editingTodo?.dueDate ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}>
                          {editingTodo?.dueDate ? new Date(editingTodo.dueDate).toLocaleString() : 'Select date & time'}
                        </span>
                        <Calendar className="h-4 w-4 text-gray-400" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Duration
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <input
                          type="number"
                          value={durationHours}
                          onChange={(e) => setDurationHours(e.target.value)}
                          min="0"
                          max="24"
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          placeholder="0"
                        />
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">Hours</div>
                      </div>
                      <div className="flex-1">
                        <input
                          type="number"
                          value={durationMinutes}
                          onChange={(e) => setDurationMinutes(e.target.value)}
                          min="0"
                          max="59"
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          placeholder="0"
                        />
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">Minutes</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    name="tags"
                    defaultValue={editingTodo?.tags.join(', ')}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="react, frontend, project"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    rows={2}
                    defaultValue={editingTodo?.notes}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Additional notes..."
                  />
                </div>

                <div className="flex space-x-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    {editingTodo ? 'Update' : 'Add Task'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingTodo(null);
                      setDurationHours('');
                      setDurationMinutes('');
                    }}
                    className="flex-1 px-3 py-1.5 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-sm hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Date Picker Modal */}
      {showDatePicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm w-full mx-4">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  Set Due Date & Time
                </h3>
                <button
                  onClick={() => setShowDatePicker(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={tempDueDate}
                    onChange={(e) => setTempDueDate(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    value={tempDueTime}
                    onChange={(e) => setTempDueTime(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleDatePickerDone}
                    className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    DONE
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 