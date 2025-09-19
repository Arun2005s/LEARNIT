const express = require('express');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get system settings
router.get('/', adminAuth, async (req, res) => {
  try {
    // In a real application, you would fetch these from a database
    // For now, we'll return default settings
    const settings = {
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
    };

    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update system settings
router.put('/', adminAuth, async (req, res) => {
  try {
    const settings = req.body;
    
    // In a real application, you would save these to a database
    // For now, we'll just return success
    console.log('Settings updated:', settings);
    
    res.json({ 
      success: true, 
      message: 'Settings updated successfully',
      settings 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
