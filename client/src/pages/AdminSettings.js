import React, { useState, useEffect } from 'react';
import { FaCog, FaSave, FaUser, FaShield, FaDatabase, FaBell, FaPalette, FaGlobe } from 'react-icons/fa';
import axios from 'axios';
import './AdminSettings.css';

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    systemName: 'LEARNIT',
    systemDescription: 'A modern Learning Management System',
    maxFileSize: 10,
    allowedFileTypes: ['pdf', 'doc', 'docx', 'jpg', 'png', 'gif'],
    emailNotifications: true,
    registrationEnabled: true,
    maintenanceMode: false,
    theme: 'light',
    language: 'en',
    timezone: 'UTC'
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get('/api/admin/settings');
      if (response.data) {
        setSettings({ ...settings, ...response.data });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileTypesChange = (e) => {
    const value = e.target.value;
    const fileTypes = value.split(',').map(type => type.trim()).filter(type => type);
    setSettings(prev => ({
      ...prev,
      allowedFileTypes: fileTypes
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await axios.put('/api/admin/settings', settings);
      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('Error saving settings. Please try again.');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const settingsSections = [
    {
      title: 'General Settings',
      icon: <FaCog />,
      fields: [
        {
          name: 'systemName',
          label: 'System Name',
          type: 'text',
          placeholder: 'Enter system name'
        },
        {
          name: 'systemDescription',
          label: 'System Description',
          type: 'textarea',
          placeholder: 'Enter system description'
        },
        {
          name: 'theme',
          label: 'Default Theme',
          type: 'select',
          options: [
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
            { value: 'auto', label: 'Auto' }
          ]
        },
        {
          name: 'language',
          label: 'Default Language',
          type: 'select',
          options: [
            { value: 'en', label: 'English' },
            { value: 'es', label: 'Spanish' },
            { value: 'fr', label: 'French' }
          ]
        }
      ]
    },
    {
      title: 'User Management',
      icon: <FaUser />,
      fields: [
        {
          name: 'registrationEnabled',
          label: 'Allow User Registration',
          type: 'checkbox'
        },
        {
          name: 'maxFileSize',
          label: 'Max File Size (MB)',
          type: 'number',
          min: 1,
          max: 100
        },
        {
          name: 'allowedFileTypes',
          label: 'Allowed File Types',
          type: 'text',
          placeholder: 'pdf, doc, docx, jpg, png, gif'
        }
      ]
    },
    {
      title: 'System Security',
      icon: <FaShield />,
      fields: [
        {
          name: 'maintenanceMode',
          label: 'Maintenance Mode',
          type: 'checkbox'
        }
      ]
    },
    {
      title: 'Notifications',
      icon: <FaBell />,
      fields: [
        {
          name: 'emailNotifications',
          label: 'Enable Email Notifications',
          type: 'checkbox'
        }
      ]
    },
    {
      title: 'System Information',
      icon: <FaDatabase />,
      fields: [
        {
          name: 'timezone',
          label: 'System Timezone',
          type: 'select',
          options: [
            { value: 'UTC', label: 'UTC' },
            { value: 'America/New_York', label: 'Eastern Time' },
            { value: 'America/Chicago', label: 'Central Time' },
            { value: 'America/Denver', label: 'Mountain Time' },
            { value: 'America/Los_Angeles', label: 'Pacific Time' }
          ]
        }
      ]
    }
  ];

  const renderField = (field) => {
    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            name={field.name}
            value={settings[field.name]}
            onChange={handleInputChange}
            placeholder={field.placeholder}
            className="settings-input"
            rows="3"
          />
        );
      case 'select':
        return (
          <select
            name={field.name}
            value={settings[field.name]}
            onChange={handleInputChange}
            className="settings-input"
          >
            {field.options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      case 'checkbox':
        return (
          <div className="checkbox-container">
            <input
              type="checkbox"
              name={field.name}
              checked={settings[field.name]}
              onChange={handleInputChange}
              className="settings-checkbox"
              id={field.name}
            />
            <label htmlFor={field.name} className="checkbox-label">
              {field.label}
            </label>
          </div>
        );
      case 'number':
        return (
          <input
            type="number"
            name={field.name}
            value={settings[field.name]}
            onChange={handleInputChange}
            placeholder={field.placeholder}
            className="settings-input"
            min={field.min}
            max={field.max}
          />
        );
      default:
        return (
          <input
            type={field.type}
            name={field.name}
            value={settings[field.name]}
            onChange={field.name === 'allowedFileTypes' ? handleFileTypesChange : handleInputChange}
            placeholder={field.placeholder}
            className="settings-input"
          />
        );
    }
  };

  return (
    <div className="admin-settings">
      <div className="settings-header">
        <h1 className="settings-title">
          <FaCog className="title-icon" />
          System Settings
        </h1>
        <p className="settings-subtitle">
          Configure system-wide settings and preferences
        </p>
      </div>

      {message && (
        <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <div className="settings-content">
        {settingsSections.map((section, index) => (
          <div key={index} className="settings-section">
            <div className="section-header">
              <div className="section-icon">{section.icon}</div>
              <h2 className="section-title">{section.title}</h2>
            </div>
            
            <div className="section-fields">
              {section.fields.map((field, fieldIndex) => (
                <div key={fieldIndex} className="field-group">
                  {field.type !== 'checkbox' && (
                    <label className="field-label">{field.label}</label>
                  )}
                  {renderField(field)}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="settings-actions">
        <button
          onClick={handleSave}
          disabled={loading}
          className="save-btn"
        >
          <FaSave className="btn-icon" />
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default AdminSettings;
