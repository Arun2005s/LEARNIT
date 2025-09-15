import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaSave, FaTimes, FaTag, FaUsers, FaEye, FaEyeSlash } from 'react-icons/fa';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import axios from 'axios';
import './CreateNote.css';

const EditNote = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: '',
    isPublic: true,
    accessList: []
  });
  const [errors, setErrors] = useState({});
  const [availableUsers, setAvailableUsers] = useState([]);
  const [showAccessControl, setShowAccessControl] = useState(false);

  useEffect(() => {
    fetchNote();
    fetchUsers();
  }, [id]);

  const fetchNote = async () => {
    try {
      const response = await axios.get(`/api/notes/${id}`);
      const noteData = response.data;
      setNote(noteData);
      
      if (!hasEditAccess(noteData)) {
        navigate('/notes');
        return;
      }

      setFormData({
        title: noteData.title,
        content: noteData.content,
        tags: noteData.tags ? noteData.tags.join(', ') : '',
        isPublic: noteData.isPublic,
        accessList: noteData.accessList || []
      });
    } catch (error) {
      console.error('Error fetching note:', error);
      navigate('/notes');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users');
      setAvailableUsers(response.data.filter(u => u._id !== user._id));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const hasEditAccess = (noteData) => {
    if (!user || !noteData) return false;
    
    if (user.role === 'admin') return true;
    
    if (noteData.author?._id === user._id) return true;
    
    if (noteData.accessList && noteData.accessList.length > 0) {
      const userAccess = noteData.accessList.find(access => access.user === user._id);
      return userAccess && userAccess.accessType === 'edit';
    }
    
    return false;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleContentChange = (content) => {
    setFormData(prev => ({ ...prev, content }));
    if (errors.content) {
      setErrors(prev => ({ ...prev, content: '' }));
    }
  };

  const handleTagsChange = (e) => {
    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
    setFormData(prev => ({ ...prev, tags: e.target.value }));
    
    if (errors.tags) {
      setErrors(prev => ({ ...prev, tags: '' }));
    }
  };

  const addUserToAccessList = (userId, accessType) => {
    const user = availableUsers.find(u => u._id === userId);
    if (user && !formData.accessList.find(access => access.user === userId)) {
      setFormData(prev => ({
        ...prev,
        accessList: [...prev.accessList, { user: userId, accessType }]
      }));
    }
  };

  const removeUserFromAccessList = (userId) => {
    setFormData(prev => ({
      ...prev,
      accessList: prev.accessList.filter(access => access.user !== userId)
    }));
  };

  const updateAccessType = (userId, accessType) => {
    setFormData(prev => ({
      ...prev,
      accessList: prev.accessList.map(access =>
        access.user === userId ? { ...access, accessType } : access
      )
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    }

    if (formData.title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      
      const noteData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      await axios.put(`/api/notes/${id}`, noteData);
      
      navigate(`/notes/${id}`);
    } catch (error) {
      console.error('Error updating note:', error);
      setErrors({ submit: error.response?.data?.message || 'Failed to update note' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/notes/${id}`);
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
          <FaTimes />
          Back to Notes
        </Link>
      </div>
    );
  }

  return (
    <div className="create-note-page">
      <div className="container">
        <div className="create-note-header">
          <h1>Edit Note</h1>
          <p>Update the educational content</p>
        </div>

        <form onSubmit={handleSubmit} className="create-note-form">
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className={`form-input ${errors.title ? 'error' : ''}`}
              placeholder="Enter note title..."
              maxLength={100}
            />
            {errors.title && <span className="error-message">{errors.title}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="content">Content *</label>
            <ReactQuill
              value={formData.content}
              onChange={handleContentChange}
              className={`quill-editor ${errors.content ? 'error' : ''}`}
              placeholder="Write your note content here..."
              modules={{
                toolbar: [
                  [{ 'header': [1, 2, 3, false] }],
                  ['bold', 'italic', 'underline', 'strike'],
                  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                  [{ 'color': [] }, { 'background': [] }],
                  ['link', 'image'],
                  ['clean']
                ]
              }}
            />
            {errors.content && <span className="error-message">{errors.content}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="tags">Tags</label>
            <div className="tags-input-container">
              <FaTag className="tags-icon" />
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleTagsChange}
                className="form-input"
                placeholder="Enter tags separated by commas..."
              />
            </div>
            <small>Separate multiple tags with commas (e.g., math, algebra, equations)</small>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isPublic"
                checked={formData.isPublic}
                onChange={handleInputChange}
                className="checkbox-input"
              />
              <span className="checkbox-custom"></span>
              <FaEye className="checkbox-icon" />
              Make this note public to all users
            </label>
          </div>

          {!formData.isPublic && (
            <div className="form-group">
              <div className="access-control-header">
                <h3>Access Control</h3>
                <button
                  type="button"
                  onClick={() => setShowAccessControl(!showAccessControl)}
                  className="btn btn-outline btn-sm"
                >
                  {showAccessControl ? 'Hide' : 'Show'} Access Control
                </button>
              </div>
              
              {showAccessControl && (
                <div className="access-control-panel">
                  <div className="add-user-section">
                    <select
                      onChange={(e) => {
                        const [userId, accessType] = e.target.value.split('|');
                        if (userId && accessType) {
                          addUserToAccessList(userId, accessType);
                          e.target.value = '';
                        }
                      }}
                      className="form-select"
                    >
                      <option value="">Add user with access...</option>
                      {availableUsers.map(user => (
                        <React.Fragment key={user._id}>
                          <option value={`${user._id}|read`}>
                            {user.fullName} - Read Only
                          </option>
                          <option value={`${user._id}|comment`}>
                            {user.fullName} - Can Comment
                          </option>
                          <option value={`${user._id}|edit`}>
                            {user.fullName} - Can Edit
                          </option>
                        </React.Fragment>
                      ))}
                    </select>
                  </div>

                  {formData.accessList.length > 0 && (
                    <div className="access-list">
                      <h4>Current Access List</h4>
                      {formData.accessList.map(access => {
                        const user = availableUsers.find(u => u._id === access.user);
                        return (
                          <div key={access.user} className="access-item">
                            <span className="user-name">{user?.fullName}</span>
                            <select
                              value={access.accessType}
                              onChange={(e) => updateAccessType(access.user, e.target.value)}
                              className="access-type-select"
                            >
                              <option value="read">Read Only</option>
                              <option value="comment">Can Comment</option>
                              <option value="edit">Can Edit</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => removeUserFromAccessList(access.user)}
                              className="btn btn-danger btn-sm"
                            >
                              <FaTimes />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {errors.submit && (
            <div className="error-message submit-error">
              {errors.submit}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              onClick={handleCancel}
              className="btn btn-outline"
              disabled={saving}
            >
              <FaTimes />
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              <FaSave />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditNote;
