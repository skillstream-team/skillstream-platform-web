import React, { useState } from 'react';
import { Users, Check, X, User } from 'lucide-react';

interface WaitingParticipant {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
}

interface WaitingRoomProps {
  isOpen: boolean;
  participants: WaitingParticipant[];
  onAdmit: (participantId: string) => void;
  onReject: (participantId: string) => void;
  onAdmitAll: () => void;
  isTeacher: boolean;
}

export const WaitingRoom: React.FC<WaitingRoomProps> = ({
  isOpen,
  participants,
  onAdmit,
  onReject,
  onAdmitAll,
  isTeacher
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Waiting Room</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {participants.length} {participants.length === 1 ? 'person' : 'people'} waiting
                </p>
              </div>
            </div>
            {isTeacher && participants.length > 0 && (
              <button
                onClick={onAdmitAll}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Admit All
              </button>
            )}
          </div>
        </div>

        {/* Participants List */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {participants.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                No one is waiting
              </p>
              <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                Students will appear here when they join
              </p>
            </div>
          ) : (
            <div className="space-y-3">
                  {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-center space-x-3">
                    {participant.avatarUrl ? (
                      <img
                        src={participant.avatarUrl}
                        alt={participant.name}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {participant.name}
                      </div>
                      {participant.email && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {participant.email}
                        </div>
                      )}
                    </div>
                  </div>
                  {isTeacher && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onAdmit(participant.id)}
                        className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                        title="Admit"
                      >
                        <Check className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => onReject(participant.id)}
                        className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        title="Reject"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                    {!isTeacher && (
                    <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-sm font-medium">
                      Waiting for approval...
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

