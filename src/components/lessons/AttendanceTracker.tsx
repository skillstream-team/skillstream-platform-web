import React, { useState, useEffect } from 'react';
import { Users, CheckCircle, XCircle, Download, Clock, AlertCircle } from 'lucide-react';
import { getLessonAttendance, markStudentAttendance, createAttendanceRecord } from '../../services/api';
import { getInitials } from '../../lib/utils';

interface AttendanceRecord {
  studentId: string;
  studentName: string;
  avatarUrl?: string;
  joinedAt: string;
  leftAt?: string;
  duration: number;
  participationScore?: number;
  status?: 'present' | 'absent' | 'late';
}

interface AttendanceTrackerProps {
  isOpen: boolean;
  onClose: () => void;
  participants: Array<{
    id: string;
    name: string;
    avatarUrl?: string;
    joinedAt: string;
  }>;
  lessonId: string;
  isTeacher: boolean;
}

export const AttendanceTracker: React.FC<AttendanceTrackerProps> = ({
  isOpen,
  onClose,
  participants,
  lessonId,
  isTeacher
}) => {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [lessonStartTime] = useState(new Date().toISOString());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadAttendance();
    }
  }, [isOpen, lessonId]);

  const loadAttendance = async () => {
    try {
      const records = await getLessonAttendance(Number(lessonId));
      if (Array.isArray(records) && records.length > 0) {
        // Map backend attendance format to AttendanceRecord
        const mapped: AttendanceRecord[] = records.map((r: any) => ({
          studentId: r.studentId || r.student?.id,
          studentName: r.studentName || r.student?.name,
          avatarUrl: r.student?.avatarUrl,
          joinedAt: r.joinedAt,
          leftAt: r.leftAt,
          duration: r.duration ?? Math.floor((Date.now() - new Date(r.joinedAt).getTime()) / 1000 / 60),
          participationScore: r.participationScore,
          status: r.status || 'present'
        }));
        setAttendance(mapped);
      } else {
        // Fallback to participants if no records yet
        const fallback: AttendanceRecord[] = participants.map(p => ({
          studentId: p.id,
          studentName: p.name,
          avatarUrl: p.avatarUrl,
          joinedAt: p.joinedAt,
          duration: Math.floor((Date.now() - new Date(p.joinedAt).getTime()) / 1000 / 60),
          status: 'present' as const
        }));
        setAttendance(fallback);
      }
    } catch (error) {
      console.error('Error loading attendance:', error);
    }
  };

  const markPresent = async (studentId: string) => {
    try {
      setSaving(true);
      setError('');
      await markStudentAttendance(Number(lessonId), studentId, 'present');
      setAttendance(prev => prev.map(record =>
        record.studentId === studentId
          ? { ...record, status: 'present', joinedAt: record.joinedAt || new Date().toISOString() }
          : record
      ));
    } catch (error: any) {
      console.error('Error marking attendance:', error);
      setError(error?.response?.data?.message || 'Failed to mark attendance. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const markAbsent = async (studentId: string) => {
    try {
      setSaving(true);
      setError('');
      await markStudentAttendance(Number(lessonId), studentId, 'absent');
      setAttendance(prev => prev.map(record =>
        record.studentId === studentId
          ? { ...record, status: 'absent' }
          : record
      ));
    } catch (error: any) {
      console.error('Error marking attendance:', error);
      setError(error?.response?.data?.message || 'Failed to mark attendance. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const markLate = async (studentId: string) => {
    try {
      setSaving(true);
      setError('');
      await markStudentAttendance(Number(lessonId), studentId, 'late');
      setAttendance(prev => prev.map(record =>
        record.studentId === studentId
          ? { ...record, status: 'late' }
          : record
      ));
    } catch (error: any) {
      console.error('Error marking attendance:', error);
      setError(error?.response?.data?.message || 'Failed to mark attendance. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const saveAllAttendance = async () => {
    if (!isTeacher) return;
    try {
      setSaving(true);
      setError('');
      const records = attendance.map(record => ({
        studentId: record.studentId,
        status: record.status || 'present'
      }));
      await createAttendanceRecord(Number(lessonId), records);
      // Reload attendance to get updated data
      await loadAttendance();
    } catch (error: any) {
      console.error('Error saving attendance:', error);
      setError(error?.response?.data?.message || 'Failed to save attendance. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const exportAttendance = () => {
    const csv = [
      ['Student Name', 'Joined At', 'Duration (minutes)', 'Status'].join(','),
      ...attendance.map(record => [
        record.studentName,
        new Date(record.joinedAt).toLocaleString(),
        record.duration,
        'Present'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance-${lessonId}-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Attendance Tracker</h2>
                <p className="text-blue-100 text-sm">
                  {attendance.length} {attendance.length === 1 ? 'student' : 'students'} present
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {isTeacher && (
                <>
                  <button
                    onClick={saveAllAttendance}
                    disabled={saving}
                    className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all font-semibold text-sm flex items-center space-x-2 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save All'}
                  </button>
                  <button
                    onClick={exportAttendance}
                    className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all font-semibold text-sm flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Export</span>
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="px-6 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
            <div className="flex items-center space-x-2 text-red-800 dark:text-red-200">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {attendance.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No attendance records yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {attendance.map((record) => (
                <div
                  key={record.studentId}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-center space-x-3">
                    {record.avatarUrl ? (
                      <img
                        src={record.avatarUrl}
                        alt={record.studentName}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {getInitials(record.studentName)}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {record.studentName}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>Joined {new Date(record.joinedAt).toLocaleTimeString()}</span>
                        </span>
                        <span>Duration: {formatDuration(record.duration)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {record.status === 'present' && (
                      <div className="flex items-center space-x-1 px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Present</span>
                      </div>
                    )}
                    {record.status === 'absent' && (
                      <div className="flex items-center space-x-1 px-3 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">
                        <XCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Absent</span>
                      </div>
                    )}
                    {record.status === 'late' && (
                      <div className="flex items-center space-x-1 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded-lg">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Late</span>
                      </div>
                    )}
                    {!record.status && (
                      <div className="flex items-center space-x-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg">
                        <span className="text-sm font-medium">Not Marked</span>
                      </div>
                    )}
                    {isTeacher && (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => markPresent(record.studentId)}
                          disabled={saving || record.status === 'present'}
                          className="p-2 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Mark Present"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => markLate(record.studentId)}
                          disabled={saving || record.status === 'late'}
                          className="p-2 text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Mark Late"
                        >
                          <AlertCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => markAbsent(record.studentId)}
                          disabled={saving || record.status === 'absent'}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Mark Absent"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    )}
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

