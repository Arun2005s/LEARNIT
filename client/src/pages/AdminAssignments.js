import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FaPlus, FaEdit, FaTrash, FaEye, FaUsers, FaCalendar, FaFileAlt } from 'react-icons/fa';
import axios from 'axios';
import './AdminAssignments.css';

const AdminAssignments = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    fileType: 'any',
    dueDate: '',
    maxFileSize: 10,
    allowedExtensions: '',
    isActive: true
  });

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await axios.get('/api/assignments');
      setAssignments(response.data);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingAssignment) {
        await axios.put(`/api/assignments/${editingAssignment._id}`, formData);
      } else {
        await axios.post('/api/assignments', formData);
      }
      
      setShowForm(false);
      setEditingAssignment(null);
      resetForm();
      fetchAssignments();
    } catch (error) {
      console.error('Error saving assignment:', error);
      alert(error.response?.data?.message || 'Failed to save assignment');
    }
  };

  const handleEdit = (assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      title: assignment.title,
      description: assignment.description,
      fileType: assignment.fileType,
      dueDate: new Date(assignment.dueDate).toISOString().split('T')[0],
      maxFileSize: assignment.maxFileSize,
      allowedExtensions: assignment.allowedExtensions.join(', '),
      isActive: assignment.isActive
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;
    
    try {
      await axios.delete(`/api/assignments/${id}`);
      fetchAssignments();
    } catch (error) {
      console.error('Error deleting assignment:', error);
      alert(error.response?.data?.message || 'Failed to delete assignment');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      fileType: 'any',
      dueDate: '',
      maxFileSize: 10,
      allowedExtensions: '',
      isActive: true
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getFileTypeLabel = (fileType) => {
    const labels = {
      'image': 'Image Files',
      'video': 'Video Files',
      'pdf': 'PDF Files',
      'url': 'URL Link',
      'document': 'Document Files',
      'any': 'Any File Type'
    };
    return labels[fileType] || fileType;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading assignments...</p>
      </div>
    );
  }

  return (
    <div className="admin-assignments-page">
      <div className="container">
        <div className="page-header">
          <h1>Assignment Management</h1>
          <button 
            className="btn btn-primary"
            onClick={() => {
              setShowForm(true);
              setEditingAssignment(null);
              resetForm();
            }}
          >
            <FaPlus />
            Create Assignment
          </button>
        </div>

        {showForm && (
          <div className="assignment-form-container">
            <div className="assignment-form">
              <h3>{editingAssignment ? 'Edit Assignment' : 'Create New Assignment'}</h3>
              
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="title">Title *</label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      className="form-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="fileType">File Type *</label>
                    <select
                      id="fileType"
                      name="fileType"
                      value={formData.fileType}
                      onChange={handleInputChange}
                      required
                      className="form-select"
                    >
                      <option value="any">Any File Type</option>
                      <option value="image">Image Files</option>
                      <option value="video">Video Files</option>
                      <option value="pdf">PDF Files</option>
                      <option value="document">Document Files</option>
                      <option value="url">URL Link</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="dueDate">Due Date *</label>
                    <input
                      type="date"
                      id="dueDate"
                      name="dueDate"
                      value={formData.dueDate}
                      onChange={handleInputChange}
                      required
                      className="form-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="maxFileSize">Max File Size (MB)</label>
                    <input
                      type="number"
                      id="maxFileSize"
                      name="maxFileSize"
                      value={formData.maxFileSize}
                      onChange={handleInputChange}
                      min="1"
                      max="100"
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="allowedExtensions">Allowed Extensions (comma-separated)</label>
                  <input
                    type="text"
                    id="allowedExtensions"
                    name="allowedExtensions"
                    value={formData.allowedExtensions}
                    onChange={handleInputChange}
                    placeholder="e.g., .jpg, .png, .pdf"
                    className="form-input"
                  />
                  <small>Leave empty to allow all extensions for the selected file type</small>
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description *</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows="4"
                    className="form-textarea"
                    placeholder="Describe the assignment requirements..."
                  />
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      className="checkbox-input"
                    />
                    <span className="checkbox-custom"></span>
                    Active Assignment
                  </label>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingAssignment ? 'Update Assignment' : 'Create Assignment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="assignments-list">
          {assignments.map((assignment) => (
            <div key={assignment._id} className="assignment-card">
              <div className="assignment-header">
                <div className="assignment-info">
                  <h3>{assignment.title}</h3>
                  <div className="assignment-meta">
                    <span className="meta-item">
                      <FaFileAlt />
                      {getFileTypeLabel(assignment.fileType)}
                    </span>
                    <span className="meta-item">
                      <FaCalendar />
                      Due: {formatDate(assignment.dueDate)}
                    </span>
                    <span className="meta-item">
                      <FaUsers />
                      {assignment.submissions?.length || 0} submissions
                    </span>
                    <span className={`status ${assignment.isActive ? 'active' : 'inactive'}`}>
                      {assignment.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                
                <div className="assignment-actions">
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setSelectedAssignment(assignment)}
                  >
                    <FaEye />
                    View
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => handleEdit(assignment)}
                  >
                    <FaEdit />
                    Edit
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(assignment._id)}
                  >
                    <FaTrash />
                    Delete
                  </button>
                </div>
              </div>
              
              <div className="assignment-description">
                <p>{assignment.description}</p>
              </div>
            </div>
          ))}
        </div>

        {selectedAssignment && (
          <div className="modal-overlay" onClick={() => setSelectedAssignment(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{selectedAssignment.title}</h3>
                <button 
                  className="close-btn"
                  onClick={() => setSelectedAssignment(null)}
                >
                  ×
                </button>
              </div>
              
              <div className="modal-body">
                <div className="assignment-details">
                  <p><strong>Description:</strong> {selectedAssignment.description}</p>
                  <p><strong>File Type:</strong> {getFileTypeLabel(selectedAssignment.fileType)}</p>
                  <p><strong>Due Date:</strong> {formatDate(selectedAssignment.dueDate)}</p>
                  <p><strong>Max File Size:</strong> {selectedAssignment.maxFileSize} MB</p>
                  {selectedAssignment.allowedExtensions?.length > 0 && (
                    <p><strong>Allowed Extensions:</strong> {selectedAssignment.allowedExtensions.join(', ')}</p>
                  )}
                  <p><strong>Status:</strong> {selectedAssignment.isActive ? 'Active' : 'Inactive'}</p>
                </div>

                <div className="submissions-section">
                  <h4>Submissions ({selectedAssignment.submissions?.length || 0})</h4>
                  {selectedAssignment.submissions && selectedAssignment.submissions.length > 0 ? (
                    <div className="submissions-list">
                      {selectedAssignment.submissions.map((submission) => (
                        <div key={submission._id} className="submission-item">
                          <div className="submission-info">
                            <span className="student-name">{submission.student?.fullName}</span>
                            <span className="submission-date">{formatDate(submission.submittedAt)}</span>
                          </div>
                          <div className="submission-file">
                            <a href={submission.fileUrl} target="_blank" rel="noopener noreferrer">
                              {submission.fileName}
                            </a>
                          </div>
                          {submission.comments && (
                            <div className="submission-comments">
                              <strong>Comments:</strong> {submission.comments}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>No submissions yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAssignments;
