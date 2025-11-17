import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Quiz } from '../../types';
import { useAuthStore } from '../../store/auth';
import { getMyQuizzes, getMyCreatedQuizzes } from '../../services/api';
import { 
  ClockIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  CalendarIcon,
  UsersIcon
} from '@heroicons/react/24/outline';

const QuizzesPage: React.FC = () => {
  const { user } = useAuthStore();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'STUDENT' | 'TEACHER'>('STUDENT');
  const navigate = useNavigate();

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const roleFromAuth = user?.role === 'TEACHER' ? 'TEACHER' : 'STUDENT';
      setUserRole(roleFromAuth);
      
      let quizzesData: Quiz[];
      if (roleFromAuth === 'STUDENT') {
        quizzesData = await getMyQuizzes();
      } else {
        quizzesData = await getMyCreatedQuizzes();
      }
      
      setQuizzes(quizzesData);
    } catch (error) {
      console.error('Failed to load quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getQuizStatus = (quiz: Quiz) => {
    const now = new Date();
    const dueDate = new Date(quiz.timeLimit || 0);
    
    if (quiz.attempts && quiz.attempts.length > 0) {
      return 'completed';
    }
    
    if (dueDate < now) {
      return 'overdue';
    }
    
    return 'pending';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'overdue':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'overdue':
        return 'Overdue';
      default:
        return 'Pending';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Quizzes</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {userRole === 'STUDENT' ? 'Take and track your course quizzes' : 'Manage your created quizzes'}
              </p>
            </div>
            {userRole === 'TEACHER' && (
              <button
                onClick={() => navigate('/quizzes/create')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Create Quiz
              </button>
            )}
          </div>
        </div>

        {/* Quizzes List */}
        <div className="space-y-4">
          {quizzes.length === 0 ? (
            <div className="text-center py-12">
              <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No quizzes</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {userRole === 'STUDENT' ? 'You have no quizzes assigned yet.' : 'You haven\'t created any quizzes yet.'}
              </p>
            </div>
          ) : (
            quizzes.map((quiz) => {
              const status = getQuizStatus(quiz);
              const bestAttempt = quiz.attempts?.reduce((best, attempt) => 
                attempt.score > (best?.score || 0) ? attempt : best
              );

              return (
                <div
                  key={quiz.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {quiz.title}
                          </h3>
                          {getStatusIcon(status)}
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            status === 'overdue' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }`}>
                            {getStatusText(status)}
                          </span>
                        </div>
                        
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                          {quiz.description}
                        </p>
                        
                        <div className="mt-4 flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center">
                            <CalendarIcon className="w-4 h-4 mr-1" />
                            {quiz.timeLimit ? `${quiz.timeLimit} minutes` : 'No time limit'}
                          </div>
                          <div className="flex items-center">
                            <UsersIcon className="w-4 h-4 mr-1" />
                            {quiz.questions?.length || 0} questions
                          </div>
                          {bestAttempt && (
                            <div className="flex items-center">
                              <CheckCircleIcon className="w-4 h-4 mr-1" />
                              Best score: {bestAttempt.score}%
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => navigate(`/quiz/${quiz.id}`)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <EyeIcon className="w-4 h-4 mr-1" />
                          {status === 'completed' ? 'Review' : 'Take Quiz'}
                        </button>
                        {userRole === 'TEACHER' && (
                          <button
                            onClick={() => navigate(`/quizzes/${quiz.id}/edit`)}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            <PencilIcon className="w-4 h-4 mr-1" />
                            Edit
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizzesPage; 