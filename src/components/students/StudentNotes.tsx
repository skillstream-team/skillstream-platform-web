import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Tag, X } from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { useNotification } from '../../hooks/useNotification';

interface Note {
  id: string;
  studentId: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface StudentNotesProps {
  studentId: string;
  studentName: string;
}

export const StudentNotes: React.FC<StudentNotesProps> = ({ studentId, studentName }) => {
  const { user } = useAuthStore();
  const { showSuccess, showError } = useNotification();
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [noteTags, setNoteTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    loadNotes();
  }, [studentId]);

  useEffect(() => {
    filterNotes();
  }, [notes, searchQuery, selectedTag]);

  const loadNotes = () => {
    try {
      const stored = localStorage.getItem(`student-notes-${studentId}-${user?.id}`);
      if (stored) {
        const parsedNotes = JSON.parse(stored);
        setNotes(parsedNotes);
      } else {
        setNotes([]);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
      setNotes([]);
    }
  };

  const saveNotes = (notesToSave: Note[]) => {
    try {
      localStorage.setItem(`student-notes-${studentId}-${user?.id}`, JSON.stringify(notesToSave));
      setNotes(notesToSave);
    } catch (error) {
      console.error('Error saving notes:', error);
      showError('Failed to Save Note', 'Unable to save note. Please try again.');
    }
  };

  const filterNotes = () => {
    let filtered = [...notes];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(note =>
        note.content.toLowerCase().includes(query) ||
        note.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    if (selectedTag !== 'all') {
      filtered = filtered.filter(note => note.tags.includes(selectedTag));
    }

    setFilteredNotes(filtered);
  };

  const getAllTags = (): string[] => {
    const tagSet = new Set<string>();
    notes.forEach(note => {
      note.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  };

  const handleAddNote = () => {
    if (!noteContent.trim()) {
      showError('Empty Note', 'Please enter some content for the note.');
      return;
    }

    const newNote: Note = {
      id: Date.now().toString(),
      studentId,
      content: noteContent.trim(),
      tags: noteTags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    saveNotes([...notes, newNote]);
    setNoteContent('');
    setNoteTags([]);
    setShowAddModal(false);
    showSuccess('Note Added', 'Your note has been saved successfully.');
  };

  const handleEditNote = () => {
    if (!editingNote || !noteContent.trim()) {
      showError('Empty Note', 'Please enter some content for the note.');
      return;
    }

    const updatedNotes = notes.map(note =>
      note.id === editingNote.id
        ? {
            ...note,
            content: noteContent.trim(),
            tags: noteTags,
            updatedAt: new Date().toISOString()
          }
        : note
    );

    saveNotes(updatedNotes);
    setEditingNote(null);
    setNoteContent('');
    setNoteTags([]);
    setShowAddModal(false);
    showSuccess('Note Updated', 'Your note has been updated successfully.');
  };

  const handleDeleteNote = (noteId: string) => {
    if (window.confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      const updatedNotes = notes.filter(note => note.id !== noteId);
      saveNotes(updatedNotes);
      showSuccess('Note Deleted', 'The note has been deleted successfully.');
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !noteTags.includes(tagInput.trim())) {
      setNoteTags([...noteTags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setNoteTags(noteTags.filter(tag => tag !== tagToRemove));
  };

  const openEditModal = (note: Note) => {
    setEditingNote(note);
    setNoteContent(note.content);
    setNoteTags([...note.tags]);
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingNote(null);
    setNoteContent('');
    setNoteTags([]);
    setTagInput('');
  };

  const allTags = getAllTags();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Notes for {studentName}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Private notes visible only to you
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Note
        </button>
      </div>

      {/* Search and Filter */}
      <div className="mb-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedTag('all')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedTag === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              All
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedTag === tag
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Notes List */}
      <div className="space-y-3">
        {filteredNotes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              {notes.length === 0
                ? 'No notes yet. Click "Add Note" to create your first note.'
                : 'No notes match your search criteria.'}
            </p>
          </div>
        ) : (
          filteredNotes.map(note => (
            <div
              key={note.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                    {note.content}
                  </p>
                  {note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {note.tags.map(tag => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        >
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {new Date(note.updatedAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => openEditModal(note)}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingNote ? 'Edit Note' : 'Add Note'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Note Content
                  </label>
                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Enter your note here..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {noteTags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                      placeholder="Add a tag..."
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                    <button
                      onClick={addTag}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={editingNote ? handleEditNote : handleAddNote}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    {editingNote ? 'Update' : 'Save'} Note
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

