import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaSearch, FaFilter, FaComments, FaCalendar, FaUser, FaTag } from 'react-icons/fa';
import axios from 'axios';
import './Notes.css';

const Notes = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/notes');
      const notesData = response.data;
      
      setNotes(notesData);
      setFilteredNotes(notesData);
      
      // Extract unique tags
      const tags = [...new Set(notesData.flatMap(note => note.tags || []))];
      setAvailableTags(tags);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    filterNotes();
  }, [searchTerm, selectedTags, notes]);

  const filterNotes = () => {
    let filtered = notes;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(note =>
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter(note =>
        selectedTags.some(tag => note.tags?.includes(tag))
      );
    }

    setFilteredNotes(filtered);
  };

  const handleTagToggle = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedTags([]);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading notes...</p>
      </div>
    );
  }

  return (
    <div className="notes-page">
      <div className="container">
        {/* Header */}
        <div className="notes-header">
          <div className="header-content">
            <h1>Learning Notes</h1>
            <p>Browse and explore educational content shared by our community</p>
          </div>
          {user?.role === 'admin' && (
            <Link to="/create-note" className="btn btn-primary">
              Create New Note
            </Link>
          )}
        </div>

        {/* Search and Filters */}
        <div className="notes-controls">
          <div className="search-container">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <button
            className={`filter-toggle ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaFilter />
            Filters
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="filters-panel">
            <div className="filter-section">
              <h4>Tags</h4>
              <div className="tags-filter">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    className={`tag-filter ${selectedTags.includes(tag) ? 'active' : ''}`}
                    onClick={() => handleTagToggle(tag)}
                  >
                    <FaTag />
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            
            <button onClick={clearFilters} className="btn btn-outline btn-sm">
              Clear Filters
            </button>
          </div>
        )}

        {/* Results Count */}
        <div className="results-info">
          <p>
            Showing {filteredNotes.length} of {notes.length} notes
            {searchTerm && ` for "${searchTerm}"`}
            {selectedTags.length > 0 && ` with tags: ${selectedTags.join(', ')}`}
          </p>
        </div>

        {/* Notes Grid */}
        {filteredNotes.length === 0 ? (
          <div className="no-notes">
            <div className="no-notes-content">
              <FaSearch className="no-notes-icon" />
              <h3>No notes found</h3>
              <p>
                {searchTerm || selectedTags.length > 0
                  ? 'Try adjusting your search or filters'
                  : 'No notes have been created yet'}
              </p>
              {user?.role === 'admin' && (
                <Link to="/create-note" className="btn btn-primary">
                  Create First Note
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="notes-grid">
            {filteredNotes.map((note) => (
              <div key={note._id} className="note-card">
                <div className="note-header">
                  <h3 className="note-title">
                    <Link to={`/notes/${note._id}`}>
                      {note.title}
                    </Link>
                  </h3>
                  <div className="note-meta">
                    <span className="note-date">
                      <FaCalendar />
                      {formatDate(note.createdAt)}
                    </span>
                    <span className="note-author">
                      <FaUser />
                      {note.author?.fullName}
                    </span>
                  </div>
                </div>

                <div className="note-content">
                  <p className="note-excerpt">
                    {note.content.length > 200
                      ? `${note.content.substring(0, 200)}...`
                      : note.content
                    }
                  </p>
                </div>

                {note.tags && note.tags.length > 0 && (
                  <div className="note-tags">
                    {note.tags.map(tag => (
                      <span key={tag} className="tag">
                        <FaTag />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="note-footer">
                  <div className="note-stats">
                    <span className="stat">
                      <FaComments />
                      {note.comments?.length || 0} comments
                    </span>
                  </div>
                  
                  <Link to={`/notes/${note._id}`} className="btn btn-primary btn-sm">
                    Read More
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notes;
