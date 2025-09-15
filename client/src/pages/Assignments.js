import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FaCalendar, FaFileAlt, FaUpload, FaCheck, FaTimes, FaEye } from 'react-icons/fa';
import axios from 'axios';
import './Assignments.css';

const Assignments = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [submissionData, setSubmissionData] = useState({
    file: null,
    url: '',
    comments: ''
  });
  const [submitting, setSubmitting] = useState(false);

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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSubmissionData(prev => ({ ...prev, file }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSubmissionData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedAssignment) return;

    try {
      setSubmitting(true);
      
      const formData = new FormData();
      formData.append('comments', submissionData.comments);

      if (selectedAssignment.fileType === 'url') {
        formData.append('url', submissionData.url);
      } else if (submissionData.file) {
        formData.append('file', submissionData.file);
      }

      await axios.post(`/api/assignments/${selectedAssignment._id}/submit`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSubmissionData({ file: null, url: '', comments: '' });
      setShowSubmissionForm(false);
      setSelectedAssignment(null);
      fetchAssignments();
      
      alert('Assignment submitted successfully!');
    } catch (error) {
      console.error('Error submitting assignment:', error);
      alert(error.response?.data?.message || 'Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
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

  const hasSubmitted = (assignment) => {
    return assignment.submissions?.some(sub => sub.student._id === user._id);
  };

  const getSubmission = (assignment) => {
    return assignment.submissions?.find(sub => sub.student._id === user._id);
  };

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date();
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
    <div className="assignments-page">
      <div className="container">
        <div className="page-header">
          <h1>Assignments</h1>
          <p>Complete your assigned tasks and submit your work</p>
        </div>

        <div className="assignments-grid">
          {assignments.map((assignment) => {
            const submitted = hasSubmitted(assignment);
            const submission = getSubmission(assignment);
            const overdue = isOverdue(assignment.dueDate);

            return (
              <div key={assignment._id} className="assignment-card">
                <div className="assignment-header">
                  <div className="assignment-status">
                    {submitted ? (
                      <span className="status submitted">
                        <FaCheck />
                        Submitted
                      </span>
                    ) : overdue ? (
                      <span className="status overdue">
                        <FaTimes />
                        Overdue
                      </span>
                    ) : (
                      <span className="status active">
                        <FaEye />
                        Active
                      </span>
                    )}
                  </div>
                  
                  <div className="assignment-meta">
                    <span className="meta-item">
                      <FaFileAlt />
                      {getFileTypeLabel(assignment.fileType)}
                    </span>
                    <span className="meta-item">
                      <FaCalendar />
                      Due: {formatDate(assignment.dueDate)}
                    </span>
                  </div>
                </div>

                <div className="assignment-content">
                  <h3>{assignment.title}</h3>
                  <p className="assignment-description">{assignment.description}</p>
                  
                  {assignment.allowedExtensions?.length > 0 && (
                    <div className="file-requirements">
                      <strong>Allowed file types:</strong> {assignment.allowedExtensions.join(', ')}
                    </div>
                  )}
                  
                  {assignment.maxFileSize && (
                    <div className="file-requirements">
                      <strong>Max file size:</strong> {assignment.maxFileSize} MB
                    </div>
                  )}
                </div>

                <div className="assignment-actions">
                  {submitted ? (
                    <div className="submission-info">
                      <p><strong>Submitted:</strong> {formatDate(submission.submittedAt)}</p>
                      <a 
                        href={submission.fileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn btn-outline btn-sm"
                      >
                        View Submission
                      </a>
                    </div>
                  ) : (
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setSelectedAssignment(assignment);
                        setShowSubmissionForm(true);
                      }}
                      disabled={overdue}
                    >
                      <FaUpload />
                      {overdue ? 'Assignment Overdue' : 'Submit Assignment'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {showSubmissionForm && selectedAssignment && (
          <div className="modal-overlay" onClick={() => setShowSubmissionForm(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Submit Assignment: {selectedAssignment.title}</h3>
                <button 
                  className="close-btn"
                  onClick={() => setShowSubmissionForm(false)}
                >
                  ×
                </button>
              </div>
              
              <div className="modal-body">
                <div className="assignment-requirements">
                  <h4>Requirements:</h4>
                  <p><strong>File Type:</strong> {getFileTypeLabel(selectedAssignment.fileType)}</p>
                  {selectedAssignment.maxFileSize && (
                    <p><strong>Max Size:</strong> {selectedAssignment.maxFileSize} MB</p>
                  )}
                  {selectedAssignment.allowedExtensions?.length > 0 && (
                    <p><strong>Allowed Extensions:</strong> {selectedAssignment.allowedExtensions.join(', ')}</p>
                  )}
                </div>

                <form onSubmit={handleSubmit} className="submission-form">
                  {selectedAssignment.fileType === 'url' ? (
                    <div className="form-group">
                      <label htmlFor="url">URL *</label>
                      <input
                        type="url"
                        id="url"
                        name="url"
                        value={submissionData.url}
                        onChange={handleInputChange}
                        required
                        className="form-input"
                        placeholder="https://example.com"
                      />
                    </div>
                  ) : (
                    <div className="form-group">
                      <label htmlFor="file">File *</label>
                      <input
                        type="file"
                        id="file"
                        name="file"
                        onChange={handleFileChange}
                        required
                        className="form-input"
                        accept={selectedAssignment.allowedExtensions?.length > 0 
                          ? selectedAssignment.allowedExtensions.join(',') 
                          : undefined}
                      />
                      <small>
                        Max size: {selectedAssignment.maxFileSize || 10} MB
                        {selectedAssignment.allowedExtensions?.length > 0 && 
                          ` • Allowed: ${selectedAssignment.allowedExtensions.join(', ')}`}
                      </small>
                    </div>
                  )}

                  <div className="form-group">
                    <label htmlFor="comments">Comments (Optional)</label>
                    <textarea
                      id="comments"
                      name="comments"
                      value={submissionData.comments}
                      onChange={handleInputChange}
                      rows="3"
                      className="form-textarea"
                      placeholder="Add any additional comments about your submission..."
                    />
                  </div>

                  <div className="form-actions">
                    <button 
                      type="button" 
                      className="btn btn-outline" 
                      onClick={() => setShowSubmissionForm(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={submitting}
                    >
                      {submitting ? 'Submitting...' : 'Submit Assignment'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Assignments;
