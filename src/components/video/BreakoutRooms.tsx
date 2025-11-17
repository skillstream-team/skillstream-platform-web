import React, { useState } from 'react';
import { Users, Plus, X, UserPlus, Shuffle, Settings } from 'lucide-react';

interface Participant {
  id: string;
  name: string;
  avatarUrl?: string;
}

interface BreakoutRoom {
  id: string;
  name: string;
  participants: Participant[];
}

interface BreakoutRoomsProps {
  isOpen: boolean;
  onClose: () => void;
  participants: Participant[];
  onAssignToRoom: (participantId: string, roomId: string) => void;
  onRemoveFromRoom: (participantId: string) => void;
  onStartRooms: () => void;
  onCloseRooms: () => void;
  isTeacher: boolean;
}

export const BreakoutRooms: React.FC<BreakoutRoomsProps> = ({
  isOpen,
  onClose,
  participants,
  onAssignToRoom,
  onRemoveFromRoom,
  onStartRooms,
  onCloseRooms,
  isTeacher
}) => {
  const [rooms, setRooms] = useState<BreakoutRoom[]>([
    { id: 'room-1', name: 'Room 1', participants: [] },
    { id: 'room-2', name: 'Room 2', participants: [] }
  ]);
  const [roomsActive, setRoomsActive] = useState(false);
  const [autoAssign, setAutoAssign] = useState(false);

  const addRoom = () => {
    setRooms(prev => [...prev, {
      id: `room-${Date.now()}`,
      name: `Room ${prev.length + 1}`,
      participants: []
    }]);
  };

  const removeRoom = (roomId: string) => {
    if (rooms.length <= 1) return;
    const room = rooms.find(r => r.id === roomId);
    if (room) {
      // Move participants back to main room
      room.participants.forEach(p => {
        onRemoveFromRoom(p.id);
      });
    }
    setRooms(prev => prev.filter(r => r.id !== roomId));
  };

  const handleAutoAssign = () => {
    const unassigned = participants.filter(p => 
      !rooms.some(r => r.participants.some(pr => pr.id === p.id))
    );
    
    const shuffled = [...unassigned].sort(() => Math.random() - 0.5);
    const roomCount = rooms.length;
    
    shuffled.forEach((participant, index) => {
      const roomIndex = index % roomCount;
      onAssignToRoom(participant.id, rooms[roomIndex].id);
    });
  };

  const getUnassignedParticipants = () => {
    const assignedIds = new Set(
      rooms.flatMap(r => r.participants.map(p => p.id))
    );
    return participants.filter(p => !assignedIds.has(p.id));
  };

  const handleStartRooms = () => {
    setRoomsActive(true);
    // TODO: Replace with actual API call
    // await apiService.startBreakoutRooms(conferenceId, rooms);
    onStartRooms();
  };

  const handleCloseRooms = () => {
    setRoomsActive(false);
    // TODO: Replace with actual API call
    // await apiService.closeBreakoutRooms(conferenceId);
    onCloseRooms();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Breakout Rooms</h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Organize participants into smaller groups
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isTeacher && !roomsActive && (
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={addRoom}
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Room
                </button>
                <button
                  onClick={handleAutoAssign}
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 transition-colors"
                >
                  <Shuffle className="h-4 w-4 mr-2" />
                  Auto Assign
                </button>
              </div>
              <button
                onClick={handleStartRooms}
                disabled={rooms.some(r => r.participants.length === 0)}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Start Rooms
              </button>
            </div>
          )}

          {roomsActive && (
            <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    Breakout rooms are active
                  </span>
                </div>
                {isTeacher && (
                  <button
                    onClick={handleCloseRooms}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
                  >
                    Close All Rooms
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Rooms Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="bg-gray-50 dark:bg-gray-700 p-4 border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {room.name}
                  </h3>
                  {isTeacher && !roomsActive && rooms.length > 1 && (
                    <button
                      onClick={() => removeRoom(room.id)}
                      className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="space-y-2 min-h-[100px]">
                  {room.participants.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      No participants
                    </p>
                  ) : (
                    room.participants.map((participant) => (
                      <div
                        key={participant.id}
                        className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg"
                      >
                        <div className="flex items-center space-x-2">
                          {participant.avatarUrl ? (
                            <img
                              src={participant.avatarUrl}
                              alt={participant.name}
                              className="w-6 h-6 rounded-full"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600"></div>
                          )}
                          <span className="text-sm text-gray-900 dark:text-white">
                            {participant.name}
                          </span>
                        </div>
                        {isTeacher && !roomsActive && (
                          <button
                            onClick={() => onRemoveFromRoom(participant.id)}
                            className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Unassigned Participants */}
          {isTeacher && !roomsActive && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                Unassigned Participants ({getUnassignedParticipants().length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {getUnassignedParticipants().map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center space-x-2 p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    {participant.avatarUrl ? (
                      <img
                        src={participant.avatarUrl}
                        alt={participant.name}
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600"></div>
                    )}
                    <span className="text-xs text-gray-900 dark:text-white truncate flex-1">
                      {participant.name}
                    </span>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          onAssignToRoom(participant.id, e.target.value);
                        }
                      }}
                      className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      defaultValue=""
                    >
                      <option value="">Assign...</option>
                      {rooms.map(room => (
                        <option key={room.id} value={room.id}>
                          {room.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

