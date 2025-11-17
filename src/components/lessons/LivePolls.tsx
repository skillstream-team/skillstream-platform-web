import React, { useState } from 'react';
import { 
  BarChart3, 
  Plus, 
  X, 
  Play, 
  CheckCircle, 
  Users,
  Clock,
  Send
} from 'lucide-react';

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  isActive: boolean;
  totalVotes: number;
  createdAt: string;
}

interface LivePollsProps {
  isOpen: boolean;
  onClose: () => void;
  participants: number;
  isTeacher: boolean;
  onPollCreated?: (poll: Poll) => void;
}

export const LivePolls: React.FC<LivePollsProps> = ({
  isOpen,
  onClose,
  participants,
  isTeacher,
  onPollCreated
}) => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [newPoll, setNewPoll] = useState({
    question: '',
    options: ['', ''] as string[]
  });
  const [activePollId, setActivePollId] = useState<string | null>(null);
  const [userVotes, setUserVotes] = useState<{ [pollId: string]: string }>({});

  const addOption = () => {
    setNewPoll(prev => ({ ...prev, options: [...prev.options, ''] }));
  };

  const removeOption = (index: number) => {
    if (newPoll.options.length <= 2) return;
    setNewPoll(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const updateOption = (index: number, value: string) => {
    setNewPoll(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
  };

  const createPoll = async () => {
    if (!newPoll.question.trim() || newPoll.options.some(opt => !opt.trim())) {
      alert('Please fill in the question and all options');
      return;
    }

    const poll: Poll = {
      id: `poll-${Date.now()}`,
      question: newPoll.question,
      options: newPoll.options.map((text, index) => ({
        id: `option-${index}`,
        text: text.trim(),
        votes: 0
      })),
      isActive: true,
      totalVotes: 0,
      createdAt: new Date().toISOString()
    };

    // TODO: Replace with actual API call
    // await apiService.createPoll(conferenceId, poll);

    setPolls(prev => [...prev, poll]);
    setActivePollId(poll.id);
    setNewPoll({ question: '', options: ['', ''] });
    setShowCreatePoll(false);
    onPollCreated?.(poll);
  };

  const startPoll = (pollId: string) => {
    setActivePollId(pollId);
    // TODO: Replace with actual API call
    // await apiService.startPoll(conferenceId, pollId);
  };

  const stopPoll = (pollId: string) => {
    setActivePollId(null);
    // TODO: Replace with actual API call
    // await apiService.stopPoll(conferenceId, pollId);
  };

  const vote = (pollId: string, optionId: string) => {
    if (userVotes[pollId]) return; // Already voted

    setPolls(prev => prev.map(poll => {
      if (poll.id === pollId) {
        const updatedOptions = poll.options.map(opt =>
          opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
        );
        return {
          ...poll,
          options: updatedOptions,
          totalVotes: poll.totalVotes + 1
        };
      }
      return poll;
    }));

    setUserVotes(prev => ({ ...prev, [pollId]: optionId }));
    
    // TODO: Replace with actual API call
    // await apiService.voteOnPoll(conferenceId, pollId, optionId);
  };

  const getPercentage = (votes: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((votes / total) * 100);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Live Polls & Quizzes</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {participants} participants
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {isTeacher && (
                <button
                  onClick={() => setShowCreatePoll(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Poll</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Create Poll Form */}
          {showCreatePoll && isTeacher && (
            <div className="mb-6 bg-gray-50 dark:bg-gray-700 p-6 border border-gray-200 dark:border-gray-600">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Create New Poll
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Question
                  </label>
                  <input
                    type="text"
                    value={newPoll.question}
                    onChange={(e) => setNewPoll(prev => ({ ...prev, question: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                    placeholder="Enter your question..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Options
                  </label>
                  <div className="space-y-2">
                    {newPoll.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                          placeholder={`Option ${index + 1}`}
                        />
                        {newPoll.options.length > 2 && (
                          <button
                            onClick={() => removeOption(index)}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={addOption}
                      className="w-full px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-colors"
                    >
                      + Add Option
                    </button>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={createPoll}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    Create & Start Poll
                  </button>
                  <button
                    onClick={() => {
                      setShowCreatePoll(false);
                      setNewPoll({ question: '', options: ['', ''] });
                    }}
                    className="px-4 py-2 text-sm font-medium bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Polls List */}
          {polls.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                No polls yet
              </p>
              {isTeacher && (
                <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                  Create a poll to engage your students
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {polls.map((poll) => (
                <div
                  key={poll.id}
                  className={`bg-gray-50 dark:bg-gray-700 p-6 border ${
                    activePollId === poll.id
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/10'
                      : 'border-gray-200 dark:border-gray-600'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                        {poll.question}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>{poll.totalVotes} votes</span>
                        </span>
                        {activePollId === poll.id && (
                          <span className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span>Active</span>
                          </span>
                        )}
                      </div>
                    </div>
                    {isTeacher && (
                      <div className="flex items-center space-x-2">
                        {activePollId === poll.id ? (
                          <button
                            onClick={() => stopPoll(poll.id)}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
                          >
                            Stop
                          </button>
                        ) : (
                          <button
                            onClick={() => startPoll(poll.id)}
                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors flex items-center space-x-2"
                          >
                            <Play className="h-4 w-4" />
                            <span>Start</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    {poll.options.map((option) => {
                      const percentage = getPercentage(option.votes, poll.totalVotes);
                      const isVoted = userVotes[poll.id] === option.id;
                      const isActive = activePollId === poll.id;

                      return (
                        <div key={option.id} className="relative">
                          {isActive && !isVoted && !isTeacher ? (
                            <button
                              onClick={() => vote(poll.id, option.id)}
                              className="w-full p-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors text-left"
                            >
                              <div className="font-medium text-gray-900 dark:text-white">
                                {option.text}
                              </div>
                            </button>
                          ) : (
                            <div className="relative p-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600">
                              <div className="flex items-center justify-between mb-2">
                                <div className="font-medium text-gray-900 dark:text-white flex items-center space-x-2">
                                  <span>{option.text}</span>
                                  {isVoted && (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  )}
                                </div>
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                  {percentage}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 overflow-hidden">
                                <div
                                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {option.votes} {option.votes === 1 ? 'vote' : 'votes'}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
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

