import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Quiz, QuizQuestion, QuizAttempt } from '../../types';
import { apiService, getQuizForTaking, submitQuizAnswers } from '../../services/api';
import { 
  ClockIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  FlagIcon
} from '@heroicons/react/24/outline';

const QuizPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (quizId) {
      loadQuiz();
    }
  }, [quizId]);

  useEffect(() => {
    if (quiz && quiz.timeLimit && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [quiz, timeLeft]);

  const loadQuiz = async () => {
    try {
      setLoading(true);
      const quizData = await getQuizForTaking(quizId!);
      setQuiz(quizData);
      if (quizData.timeLimit) {
        setTimeLeft(quizData.timeLimit * 60); // Convert to seconds
      }
    } catch (error) {
      console.error('Failed to load quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleFlagQuestion = (questionIndex: number) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionIndex)) {
        newSet.delete(questionIndex);
      } else {
        newSet.add(questionIndex);
      }
      return newSet;
    });
  };

  const handleSubmitQuiz = async () => {
    if (submitting) return;

    try {
      setSubmitting(true);
      // Transform answers to the expected format
      const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
        questionId: parseInt(questionId),
        selectedOptionIds: Array.isArray(answer) ? answer : [answer]
      }));
      
      const result = await submitQuizAnswers(quizId!, formattedAnswers);
      setAttempt(result);
      setShowResults(true);
    } catch (error) {
      console.error('Failed to submit quiz:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'MULTIPLE_CHOICE':
        return 'Multiple Choice';
      case 'TRUE_FALSE':
        return 'True/False';
      case 'SHORT_ANSWER':
        return 'Short Answer';
      case 'ESSAY':
        return 'Essay';
      default:
        return type;
    }
  };

  const renderQuestion = (question: QuizQuestion) => {
    const currentAnswer = answers[question.id];

    switch (question.type) {
      case 'MULTIPLE_CHOICE':
        return (
          <div className="space-y-3">
            {question.answers.map((answer) => (
              <label
                key={answer.id}
                className="flex items-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <input
                  type="radio"
                  name={question.id}
                  value={answer.id}
                  checked={currentAnswer === answer.id}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="ml-3 text-sm text-gray-900 dark:text-white">
                  {answer.text}
                </span>
              </label>
            ))}
          </div>
        );

      case 'TRUE_FALSE':
        return (
          <div className="space-y-3">
            {[
              { id: 'true', text: 'True' },
              { id: 'false', text: 'False' }
            ].map((option) => (
              <label
                key={option.id}
                className="flex items-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <input
                  type="radio"
                  name={question.id}
                  value={option.id}
                  checked={currentAnswer === option.id}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="ml-3 text-sm text-gray-900 dark:text-white">
                  {option.text}
                </span>
              </label>
            ))}
          </div>
        );

      case 'SHORT_ANSWER':
        return (
          <textarea
            value={currentAnswer || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            rows={3}
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            placeholder="Enter your answer..."
          />
        );

      case 'ESSAY':
        return (
          <textarea
            value={currentAnswer || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            rows={8}
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            placeholder="Write your essay answer..."
          />
        );

      default:
        return <p>Unsupported question type</p>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Quiz not found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              The quiz you're looking for doesn't exist or you don't have access to it.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (showResults && attempt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900">
                <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
                Quiz Completed!
              </h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Your score: {attempt.score} out of {quiz.questions.reduce((total, q) => total + q.points, 0)} points
              </p>
              <div className="mt-6">
                <button
                  onClick={() => navigate('/courses')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Back to Courses
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const totalQuestions = quiz.questions.length;
  const answeredQuestions = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-purple-50/20 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{quiz.title}</h1>
              <p className="text-gray-600 dark:text-gray-400">{quiz.description}</p>
            </div>
            <div className="flex items-center space-x-4">
              {quiz.timeLimit && (
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <ClockIcon className="w-4 h-4 mr-1" />
                  <span className={timeLeft < 300 ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                    {formatTime(timeLeft)}
                  </span>
                </div>
              )}
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              {/* Question Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {getQuestionTypeLabel(currentQuestion.type)}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {currentQuestion.points} points
                  </span>
                </div>
                <button
                  onClick={() => handleFlagQuestion(currentQuestionIndex)}
                  className={`p-2 rounded-md ${
                    flaggedQuestions.has(currentQuestionIndex)
                      ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                >
                  <FlagIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Question */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  {currentQuestion.text}
                </h3>
                {renderQuestion(currentQuestion)}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-600">
                <button
                  onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeftIcon className="w-4 h-4 mr-2" />
                  Previous
                </button>

                <div className="flex items-center space-x-3">
                  {currentQuestionIndex === totalQuestions - 1 ? (
                    <button
                      onClick={handleSubmitQuiz}
                      disabled={submitting}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Submitting...
                        </>
                      ) : (
                        'Submit Quiz'
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => setCurrentQuestionIndex(prev => Math.min(totalQuestions - 1, prev + 1))}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Next
                      <ArrowRightIcon className="w-4 h-4 ml-2" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Question Navigator
              </h3>
              <div className="grid grid-cols-5 gap-2">
                {quiz.questions.map((question, index) => (
                  <button
                    key={question.id}
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={`p-2 text-xs font-medium rounded-md ${
                      index === currentQuestionIndex
                        ? 'bg-indigo-600 text-white'
                        : answers[question.id]
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : flaggedQuestions.has(index)
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-indigo-600 rounded mr-2"></div>
                  <span className="text-gray-600 dark:text-gray-400">Current</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-100 dark:bg-green-900 rounded mr-2"></div>
                  <span className="text-gray-600 dark:text-gray-400">Answered</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-100 dark:bg-red-900 rounded mr-2"></div>
                  <span className="text-gray-600 dark:text-gray-400">Flagged</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Progress: {answeredQuestions} of {totalQuestions} answered
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizPage; 