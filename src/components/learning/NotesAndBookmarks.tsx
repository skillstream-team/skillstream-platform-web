import React, { useState, useEffect } from 'react';
import { Bookmark, FileText, Clock, Trash2, Edit3, Plus, X, Save, Video } from 'lucide-react';
import { useAuthStore } from '../../store/auth';

interface Bookmark {
  id: string;
  time: number;
  note: string;
  timestamp: string;
  lessonId: string;
}

interface Note {
  id: string;
  content: string;
  timestamp: string;
  lessonId: string;
  videoTime?: number;
}

interface NotesAndBookmarksProps {
  lessonId: string;
  currentTime?: number;
  duration?: number;
  onJumpToTime?: (time: number) => void;
}

export const NotesAndBookmarks: React.FC<NotesAndBookmarksProps> = ({
  lessonId,
  currentTime = 0,
  duration = 0,
  onJumpToTime
}) => {
  const { user } = useAuthStore();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'notes'>('bookmarks');
  const [showBookmarkModal, setShowBookmarkModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [bookmarkNote, setBookmarkNote] = useState('');
  const [noteContent, setNoteContent] = useState('');

  useEffect(() => {
    loadBookmarks();
    loadNotes();
  }, [lessonId]);

  const loadBookmarks = () => {
    const saved = localStorage.getItem(`bookmarks-${lessonId}`);
    if (saved) {
      try {
        setBookmarks(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading bookmarks:', error);
        setBookmarks([]);
      }
    } else {
      setBookmarks([]);
    }
  };

  const loadNotes = () => {
    const saved = localStorage.getItem(`notes-${lessonId}`);
    if (saved) {
      try {
        setNotes(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading notes:', error);
        setNotes([]);
      }
    } else {
      setNotes([]);
    }
  };

  const saveBookmarks = (newBookmarks: Bookmark[]) => {
    localStorage.setItem(`bookmarks-${lessonId}`, JSON.stringify(newBookmarks));
    setBookmarks(newBookmarks);
  };

  const saveNotes = (newNotes: Note[]) => {
    localStorage.setItem(`notes-${lessonId}`, JSON.stringify(newNotes));
    setNotes(newNotes);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleAddBookmark = () => {
    if (currentTime > 0) {
      setBookmarkNote('');
      setEditingBookmark(null);
      setShowBookmarkModal(true);
    }
  };

  const handleSaveBookmark = () => {
    if (editingBookmark) {
      const updated = bookmarks.map(b =>
        b.id === editingBookmark.id
          ? { ...b, note: bookmarkNote, time: currentTime }
          : b
      );
      saveBookmarks(updated);
    } else {
      const newBookmark: Bookmark = {
        id: Date.now().toString(),
        time: currentTime,
        note: bookmarkNote,
        timestamp: new Date().toISOString(),
        lessonId
      };
      saveBookmarks([...bookmarks, newBookmark]);
    }
    setShowBookmarkModal(false);
    setBookmarkNote('');
    setEditingBookmark(null);
  };

  const handleDeleteBookmark = (id: string) => {
    if (window.confirm('Are you sure you want to delete this bookmark?')) {
      saveBookmarks(bookmarks.filter(b => b.id !== id));
    }
  };

  const handleEditBookmark = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark);
    setBookmarkNote(bookmark.note);
    setShowBookmarkModal(true);
  };

  const handleAddNote = () => {
    setNoteContent('');
    setEditingNote(null);
    setShowNoteModal(true);
  };

  const handleSaveNote = () => {
    if (editingNote) {
      const updated = notes.map(n =>
        n.id === editingNote.id
          ? { ...n, content: noteContent, videoTime: currentTime }
          : n
      );
      saveNotes(updated);
    } else {
      const newNote: Note = {
        id: Date.now().toString(),
        content: noteContent,
        timestamp: new Date().toISOString(),
        lessonId,
        videoTime: currentTime
      };
      saveNotes([...notes, newNote]);
    }
    setShowNoteModal(false);
    setNoteContent('');
    setEditingNote(null);
  };

  const handleDeleteNote = (id: string) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      saveNotes(notes.filter(n => n.id !== id));
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setNoteContent(note.content);
    setShowNoteModal(true);
  };

  const handleJumpToTime = (time: number) => {
    onJumpToTime?.(time);
  };

  return (
    <div className="bg-white rounded-lg border-2" style={{ borderColor: '#E5E7EB' }}>
      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: '#E5E7EB' }}>
        <button
          onClick={() => setActiveTab('bookmarks')}
          className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
            activeTab === 'bookmarks'
              ? 'border-b-2'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          style={{
            borderBottomColor: activeTab === 'bookmarks' ? '#00B5AD' : 'transparent',
            color: activeTab === 'bookmarks' ? '#00B5AD' : '#6F73D2'
          }}
        >
          <div className="flex items-center justify-center space-x-2">
            <Bookmark className="h-4 w-4" />
            <span>Bookmarks ({bookmarks.length})</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
            activeTab === 'notes'
              ? 'border-b-2'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          style={{
            borderBottomColor: activeTab === 'notes' ? '#00B5AD' : 'transparent',
            color: activeTab === 'notes' ? '#00B5AD' : '#6F73D2'
          }}
        >
          <div className="flex items-center justify-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Notes ({notes.length})</span>
          </div>
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'bookmarks' ? (
          <div className="space-y-4">
            <button
              onClick={handleAddBookmark}
              disabled={currentTime === 0}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: currentTime === 0 ? '#E5E7EB' : 'rgba(0, 181, 173, 0.1)',
                color: currentTime === 0 ? '#9CA3AF' : '#00B5AD'
              }}
            >
              <Plus className="h-4 w-4" />
              <span>Add Bookmark at {formatTime(currentTime)}</span>
            </button>

            {bookmarks.length === 0 ? (
              <div className="text-center py-8">
                <Bookmark className="h-12 w-12 mx-auto mb-3" style={{ color: '#9CA3AF' }} />
                <p className="text-sm" style={{ color: '#6F73D2' }}>
                  No bookmarks yet. Add one to mark important moments in the video.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {bookmarks
                  .sort((a, b) => a.time - b.time)
                  .map((bookmark) => (
                    <div
                      key={bookmark.id}
                      className="p-3 rounded-lg border-2 transition-all hover:shadow-sm"
                      style={{
                        borderColor: '#E5E7EB',
                        backgroundColor: 'white'
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <button
                            onClick={() => handleJumpToTime(bookmark.time)}
                            className="flex items-center space-x-2 mb-2 group"
                          >
                            <Clock className="h-4 w-4" style={{ color: '#00B5AD' }} />
                            <span className="text-sm font-semibold group-hover:underline" style={{ color: '#00B5AD' }}>
                              {formatTime(bookmark.time)}
                            </span>
                          </button>
                          {bookmark.note && (
                            <p className="text-sm" style={{ color: '#0B1E3F' }}>
                              {bookmark.note}
                            </p>
                          )}
                          <p className="text-xs mt-1" style={{ color: '#6F73D2' }}>
                            {new Date(bookmark.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          <button
                            onClick={() => handleEditBookmark(bookmark)}
                            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                            title="Edit bookmark"
                          >
                            <Edit3 className="h-3.5 w-3.5" style={{ color: '#6F73D2' }} />
                          </button>
                          <button
                            onClick={() => handleDeleteBookmark(bookmark.id)}
                            className="p-1.5 rounded hover:bg-red-50 transition-colors"
                            title="Delete bookmark"
                          >
                            <Trash2 className="h-3.5 w-3.5" style={{ color: '#EF4444' }} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <button
              onClick={handleAddNote}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors"
              style={{
                backgroundColor: 'rgba(0, 181, 173, 0.1)',
                color: '#00B5AD'
              }}
            >
              <Plus className="h-4 w-4" />
              <span>Add Note</span>
            </button>

            {notes.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto mb-3" style={{ color: '#9CA3AF' }} />
                <p className="text-sm" style={{ color: '#6F73D2' }}>
                  No notes yet. Add notes to capture your thoughts and insights.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {notes
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .map((note) => (
                    <div
                      key={note.id}
                      className="p-4 rounded-lg border-2 transition-all hover:shadow-sm"
                      style={{
                        borderColor: '#E5E7EB',
                        backgroundColor: 'white'
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {note.videoTime !== undefined && (
                            <button
                              onClick={() => handleJumpToTime(note.videoTime!)}
                              className="flex items-center space-x-1 text-xs group"
                            >
                              <Video className="h-3 w-3" style={{ color: '#00B5AD' }} />
                              <span className="group-hover:underline" style={{ color: '#00B5AD' }}>
                                {formatTime(note.videoTime)}
                              </span>
                            </button>
                          )}
                          <span className="text-xs" style={{ color: '#6F73D2' }}>
                            {new Date(note.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleEditNote(note)}
                            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                            title="Edit note"
                          >
                            <Edit3 className="h-3.5 w-3.5" style={{ color: '#6F73D2' }} />
                          </button>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="p-1.5 rounded hover:bg-red-50 transition-colors"
                            title="Delete note"
                          >
                            <Trash2 className="h-3.5 w-3.5" style={{ color: '#EF4444' }} />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm whitespace-pre-wrap" style={{ color: '#0B1E3F' }}>
                        {note.content}
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bookmark Modal */}
      {showBookmarkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: '#0B1E3F' }}>
                {editingBookmark ? 'Edit Bookmark' : 'Add Bookmark'}
              </h3>
              <button
                onClick={() => {
                  setShowBookmarkModal(false);
                  setBookmarkNote('');
                  setEditingBookmark(null);
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm mb-4" style={{ color: '#6F73D2' }}>
              At {formatTime(currentTime)}
            </p>
            <textarea
              value={bookmarkNote}
              onChange={(e) => setBookmarkNote(e.target.value)}
              placeholder="Add a note for this bookmark..."
              className="w-full p-3 border-2 rounded-lg mb-4 resize-none"
              style={{
                borderColor: '#E5E7EB',
                backgroundColor: 'white',
                color: '#0B1E3F'
              }}
              rows={3}
            />
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowBookmarkModal(false);
                  setBookmarkNote('');
                  setEditingBookmark(null);
                }}
                className="flex-1 px-4 py-2 border-2 rounded-lg font-medium"
                style={{ borderColor: '#E5E7EB', color: '#0B1E3F' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveBookmark}
                className="flex-1 px-4 py-2 rounded-lg font-medium text-white"
                style={{ backgroundColor: '#00B5AD' }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: '#0B1E3F' }}>
                {editingNote ? 'Edit Note' : 'Add Note'}
              </h3>
              <button
                onClick={() => {
                  setShowNoteModal(false);
                  setNoteContent('');
                  setEditingNote(null);
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {currentTime > 0 && (
              <p className="text-sm mb-4" style={{ color: '#6F73D2' }}>
                Video time: {formatTime(currentTime)}
              </p>
            )}
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Write your note here..."
              className="w-full p-3 border-2 rounded-lg mb-4 resize-none"
              style={{
                borderColor: '#E5E7EB',
                backgroundColor: 'white',
                color: '#0B1E3F'
              }}
              rows={6}
            />
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowNoteModal(false);
                  setNoteContent('');
                  setEditingNote(null);
                }}
                className="flex-1 px-4 py-2 border-2 rounded-lg font-medium"
                style={{ borderColor: '#E5E7EB', color: '#0B1E3F' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNote}
                disabled={!noteContent.trim()}
                className="flex-1 px-4 py-2 rounded-lg font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#00B5AD' }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

