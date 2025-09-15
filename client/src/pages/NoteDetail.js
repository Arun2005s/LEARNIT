import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaArrowLeft, FaUser, FaCalendar, FaTag, FaEye, FaComments, FaEdit, FaTrash } from 'react-icons/fa';
import axios from 'axios';
import './NoteDetail.css';

const NoteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchNote();
  }, [id]);

  const fetchNote = async () => {
    try {
      const response = await axios.get(`/api/notes/${id}`);
      setNote(response.data);
    } catch (error) {
      console.error('Error fetching note:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      setSubmitting(true);
      await axios.post(`/api/notes/${id}/comments`, { content: comment });
      setComment('');
      fetchNote();
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDelete = async () => {
    if (!user || user.role !== 'admin') return;
    const confirmed = window.confirm('Are you sure you want to delete this note? This action cannot be undone.');
    if (!confirmed) return;

    try {
      setDeleting(true);
      await axios.delete(`/api/notes/${id}`);
      navigate('/notes');
    } catch (error) {
      console.error('Error deleting note:', error);
      alert(error.response?.data?.message || 'Failed to delete note');
    } finally {
      setDeleting(false);
    }
  };

  const hasEditAccess = () => {
    if (!user || !note) return false;
    
    if (user.role === 'admin') return true;
    
    if (note.author?._id === user._id) return true;
    
    if (note.accessList && note.accessList.length > 0) {
      const userAccess = note.accessList.find(access => access.user === user._id);
      return userAccess && userAccess.accessType === 'edit';
    }
    
    return false;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading note...</p>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="note-not-found">
        <h2>Note not found</h2>
        <Link to="/notes" className="btn btn-primary">
          <FaArrowLeft />
          Back to Notes
        </Link>
      </div>
    );
  }

  return (
    <div className="note-detail-page">
      <div className="container">
        <div className="note-header">
          <Link to="/notes" className="back-btn">
            <FaArrowLeft />
            Back to Notes
          </Link>
          
          {hasEditAccess() && (
            <div className="admin-actions">
              <Link to={`/notes/${id}/edit`} className="btn btn-outline">
                <FaEdit />
                Edit
              </Link>
              {user?.role === 'admin' && (
                <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
                  <FaTrash />
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="note-content">
          <div className="note-title">
            <h1>{note.title}</h1>
          </div>

          <div className="note-meta">
            <div className="meta-item">
              <FaUser />
              <span>By {note.author?.fullName}</span>
            </div>
            <div className="meta-item">
              <FaCalendar />
              <span>{formatDate(note.createdAt)}</span>
            </div>

            <div className="meta-item">
              <FaComments />
              <span>{note.comments?.length || 0} comments</span>
            </div>
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

          <div className="note-body">
            <div 
              className="content"
              dangerouslySetInnerHTML={{ __html: note.content }}
            />
          </div>
        </div>

        <div className="comments-section">
          <h3>Comments ({note.comments?.length || 0})</h3>
          
          {user && (
            <form onSubmit={handleCommentSubmit} className="comment-form">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                className="comment-input"
                rows="3"
                required
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting || !comment.trim()}
              >
                {submitting ? 'Posting...' : 'Post Comment'}
              </button>
            </form>
          )}

          <div className="comments-list">
            {note.comments && note.comments.length > 0 ? (
              note.comments.map((comment) => (
                <div key={comment._id} className="comment-item">
                  <div className="comment-header">
                    <span className="comment-author">{comment.user?.fullName}</span>
                    <span className="comment-date">{formatDate(comment.createdAt)}</span>
                  </div>
                  <div className="comment-content">
                    {comment.content}
                  </div>
                </div>
              ))
            ) : (
              <p className="no-comments">No comments yet. Be the first to comment!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteDetail;
