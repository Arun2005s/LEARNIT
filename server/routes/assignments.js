const express = require('express');
const Assignment = require('../models/Assignment');
const { auth, adminAuth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/assignments/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: function (req, file, cb) {
    // Allow all file types for now, validation will be done in the route
    cb(null, true);
  }
});

// Get all assignments (admin sees all, students see active ones)
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    
    // Students only see active assignments
    if (req.user.role !== 'admin') {
      query.isActive = true;
    }

    const assignments = await Assignment.find(query)
      .populate('createdBy', 'fullName username')
      .populate('submissions.student', 'fullName username')
      .sort({ createdAt: -1 });

    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single assignment by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('createdBy', 'fullName username')
      .populate('submissions.student', 'fullName username');

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Students can only see active assignments
    if (req.user.role !== 'admin' && !assignment.isActive) {
      return res.status(403).json({ message: 'Assignment not available' });
    }

    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new assignment (admin only)
router.post('/', adminAuth, async (req, res) => {
  try {
    const { title, description, fileType, dueDate, maxFileSize, allowedExtensions } = req.body;

    const assignment = new Assignment({
      title,
      description,
      fileType,
      dueDate: new Date(dueDate),
      maxFileSize: maxFileSize || 10,
      allowedExtensions: allowedExtensions || [],
      createdBy: req.user._id
    });

    await assignment.save();

    const populatedAssignment = await Assignment.findById(assignment._id)
      .populate('createdBy', 'fullName username');

    res.status(201).json(populatedAssignment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update assignment (admin only)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { title, description, fileType, dueDate, maxFileSize, allowedExtensions, isActive } = req.body;

    const updatedAssignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        fileType,
        dueDate: new Date(dueDate),
        maxFileSize,
        allowedExtensions,
        isActive
      },
      { new: true }
    ).populate('createdBy', 'fullName username');

    if (!updatedAssignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    res.json(updatedAssignment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete assignment (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    await Assignment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Submit assignment (students only)
router.post('/:id/submit', auth, upload.single('file'), async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.status(403).json({ message: 'Admins cannot submit assignments' });
    }

    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    if (!assignment.isActive) {
      return res.status(403).json({ message: 'Assignment is not active' });
    }

    // Check if student already submitted
    const existingSubmission = assignment.submissions.find(
      sub => sub.student.toString() === req.user._id.toString()
    );

    if (existingSubmission) {
      return res.status(400).json({ message: 'You have already submitted this assignment' });
    }

    // Validate file type if specified
    if (assignment.fileType !== 'any' && assignment.fileType !== 'url') {
      if (!req.file) {
        return res.status(400).json({ message: 'File is required for this assignment' });
      }

      const fileExtension = path.extname(req.file.originalname).toLowerCase();
      
      if (assignment.allowedExtensions.length > 0 && 
          !assignment.allowedExtensions.includes(fileExtension)) {
        return res.status(400).json({ 
          message: `File type not allowed. Allowed types: ${assignment.allowedExtensions.join(', ')}` 
        });
      }
    }

    // For URL submissions
    if (assignment.fileType === 'url' && !req.body.url) {
      return res.status(400).json({ message: 'URL is required for this assignment' });
    }

    const submission = {
      student: req.user._id,
      submittedAt: new Date(),
      fileUrl: req.file ? `/uploads/assignments/${req.file.filename}` : req.body.url,
      fileName: req.file ? req.file.originalname : req.body.url,
      fileType: req.file ? path.extname(req.file.originalname) : 'url',
      comments: req.body.comments || ''
    };

    assignment.submissions.push(submission);
    await assignment.save();

    res.status(201).json(submission);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Grade assignment submission (admin only)
router.put('/:id/submissions/:submissionId/grade', adminAuth, async (req, res) => {
  try {
    const { grade, feedback } = req.body;

    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const submission = assignment.submissions.id(req.params.submissionId);
    
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    submission.grade = grade;
    submission.feedback = feedback;

    await assignment.save();

    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's submissions
router.get('/user/submissions', auth, async (req, res) => {
  try {
    const assignments = await Assignment.find({
      'submissions.student': req.user._id
    }).populate('createdBy', 'fullName username');

    const userSubmissions = assignments.map(assignment => {
      const submission = assignment.submissions.find(
        sub => sub.student.toString() === req.user._id.toString()
      );
      return {
        assignment: {
          _id: assignment._id,
          title: assignment.title,
          dueDate: assignment.dueDate,
          createdBy: assignment.createdBy
        },
        submission
      };
    });

    res.json(userSubmissions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
