import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Assignment } from '../../types';
import { apiService } from '../../services/api';
import { 
  ArrowLeftIcon,
  DocumentTextIcon,
  PaperClipIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const AssignmentSubmitPage: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (assignmentId) {
      loadAssignment();
    }
  }, [assignmentId]);

  const loadAssignment = async () => {
    try {
      setLoading(true);
      const assignmentData = await apiService.getAssignment(assignmentId!);
      setAssignment(assignmentData);
    } catch (error) {
      console.error('Failed to load assignment:', error);
      setError('Failed to load assignment details');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('Please provide assignment content');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      // Upload files first
      const uploadedFiles: string[] = [];
      for (const file of attachments) {
        try {
          const uploadResult = await apiService.uploadFile(file, 'personal', {
            category: 'assignment',
            tags: ['assignment-submission']
          });
          uploadedFiles.push(uploadResult.url);
        } catch (error) {
          console.error('Failed to upload file:', file.name, error);
          setError(`Failed to upload ${file.name}`);
          return;
        }
      }

      // Submit assignment
      await apiService.submitAssignment(assignmentId!, {
        content,
        attachments: uploadedFiles
      });

      // Show success and redirect
      navigate(`/assignments/${assignmentId}`, { 
        state: { message: 'Assignment submitted successfully!' }
      });
    } catch (error) {
      console.error('Failed to submit assignment:', error);
      setError('Failed to submit assignment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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

  if (!assignment) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Assignment not found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              The assignment you're looking for doesn't exist or you don't have access to it.
            </p>
            <div className="mt-6">
              <button
                onClick={() => navigate('/assignments')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back to Assignments
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(`/assignments/${assignmentId}`)}
            className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-1" />
            Back to Assignment
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Submit Assignment</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Submit your work for "{assignment.title}"
          </p>
        </div>

        {/* Assignment Details */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {assignment.title}
            </h2>
            <div className="prose prose-sm max-w-none text-gray-600 dark:text-gray-400 mb-4">
              <p>{assignment.description}</p>
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center">
                <DocumentTextIcon className="w-4 h-4 mr-1" />
                {assignment.totalPoints} points
              </div>
              <div className="flex items-center">
                <CheckCircleIcon className="w-4 h-4 mr-1" />
                Due: {new Date(assignment.dueDate).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Submission Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <div className="flex">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-400 mr-2" />
                    <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Assignment Content *
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={12}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Write your assignment content here..."
                  required
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  You can use markdown formatting for better presentation.
                </p>
              </div>

              {/* File Attachments */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Attachments
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
                  <div className="text-center">
                    <PaperClipIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-2">
                      <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        <PaperClipIcon className="w-4 h-4 mr-2" />
                        Choose Files
                        <input
                          type="file"
                          multiple
                          onChange={handleFileUpload}
                          className="hidden"
                          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                        />
                      </label>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      PDF, DOC, DOCX, TXT, JPG, PNG, GIF up to 10MB each
                    </p>
                  </div>
                </div>

                {/* Attached Files */}
                {attachments.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Attached Files ({attachments.length})
                    </h4>
                    <div className="space-y-2">
                      {attachments.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md"
                        >
                          <div className="flex items-center">
                            <DocumentTextIcon className="w-5 h-5 text-gray-400 mr-2" />
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {file.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {formatFileSize(file.size)}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => navigate(`/assignments/${assignmentId}`)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !content.trim()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    'Submit Assignment'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentSubmitPage; 