const express = require('express');
const Assignment = require('../models/Assignment');
const { auth, adminAuth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Helper function to process allowedExtensions
const processAllowedExtensions = (allowedExtensions) => {
  if (!allowedExtensions) return [];
  
  let extensions = [];
  if (typeof allowedExtensions === 'string' && allowedExtensions.trim()) {
    extensions = allowedExtensions
      .split(',')
      .map(ext => ext.trim())
      .filter(ext => ext.length > 0)
      .map(ext => ext.startsWith('.') ? ext : `.${ext}`); // Ensure extensions start with dot
  } else if (Array.isArray(allowedExtensions)) {
    extensions = allowedExtensions
      .map(ext => ext.trim())
      .filter(ext => ext.length > 0)
      .map(ext => ext.startsWith('.') ? ext : `.${ext}`); // Ensure extensions start with dot
  }
  
  // Add common file extension aliases
  const aliases = {
    '.jpg': ['.jpeg', '.jpe', '.jfif'],
    '.jpeg': ['.jpg', '.jpe', '.jfif'],
    '.png': ['.PNG'],
    '.pdf': ['.PDF'],
    '.doc': ['.DOC'],
    '.docx': ['.DOCX'],
    '.txt': ['.TXT'],
    '.mp4': ['.MP4'],
    '.avi': ['.AVI'],
    '.mov': ['.MOV']
  };
  
  const allExtensions = [...extensions];
  extensions.forEach(ext => {
    if (aliases[ext]) {
      allExtensions.push(...aliases[ext]);
    }
  });
  
  return [...new Set(allExtensions)]; // Remove duplicates
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads', 'assignments'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024
  },
  fileFilter: function (req, file, cb) {
    cb(null, true);
  }
});

router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role !== 'admin') {
      query.isActive = true;
    }

    const assignments = await Assignment.find(query)
      .populate('createdBy', 'fullName username')
      .populate('submissions.student', 'fullName username')
      .sort({ createdAt: -1 });

    // Fix any assignments with old allowedExtensions format
    for (let assignment of assignments) {
      if (assignment.allowedExtensions && assignment.allowedExtensions.length > 0) {
        const firstExt = assignment.allowedExtensions[0];
        if (typeof firstExt === 'string' && firstExt.includes(',')) {
          // This is the old format - fix it
          const processedExtensions = processAllowedExtensions(firstExt);
          assignment.allowedExtensions = processedExtensions;
          await assignment.save();
          console.log(`Fixed allowedExtensions for assignment: ${assignment.title}`);
        }
      } else if (assignment.allowedExtensions && assignment.allowedExtensions.length === 1 && 
                 typeof assignment.allowedExtensions[0] === 'string' && 
                 assignment.allowedExtensions[0].includes(',')) {
        // Handle case where it's a single string with commas
        const processedExtensions = processAllowedExtensions(assignment.allowedExtensions[0]);
        assignment.allowedExtensions = processedExtensions;
        await assignment.save();
        console.log(`Fixed allowedExtensions for assignment: ${assignment.title}`);
      }
    }

    // Normalize submission file URLs to current host (fixes localhost links across devices)
    const hostBase = `${req.protocol}://${req.get('host')}`;
    const normalizedAssignments = assignments.map(doc => {
      const assignment = doc.toObject ? doc.toObject() : doc;
      if (Array.isArray(assignment.submissions)) {
        assignment.submissions = assignment.submissions.map(sub => {
          if (sub && sub.fileUrl) {
            try {
              const parsed = new URL(sub.fileUrl, hostBase);
              // If stored as localhost or as a relative path, rewrite to current host
              if (parsed.hostname === 'localhost' || sub.fileUrl.startsWith('/')) {
                sub.fileUrl = `${hostBase}${parsed.pathname}`;
              }
            } catch (e) {
              // If URL constructor fails and it's an uploads path, prefix with host
              if (typeof sub.fileUrl === 'string' && sub.fileUrl.startsWith('/uploads/')) {
                sub.fileUrl = `${hostBase}${sub.fileUrl}`;
              }
            }
          }
          return sub;
        });
      }
      return assignment;
    });

    res.json(normalizedAssignments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('createdBy', 'fullName username')
      .populate('submissions.student', 'fullName username');

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    if (req.user.role !== 'admin' && !assignment.isActive) {
      return res.status(403).json({ message: 'Assignment not available' });
    }

    // Normalize submission file URLs to current host
    const hostBase = `${req.protocol}://${req.get('host')}`;
    const obj = assignment.toObject ? assignment.toObject() : assignment;
    if (Array.isArray(obj.submissions)) {
      obj.submissions = obj.submissions.map(sub => {
        if (sub && sub.fileUrl) {
          try {
            const parsed = new URL(sub.fileUrl, hostBase);
            if (parsed.hostname === 'localhost' || sub.fileUrl.startsWith('/')) {
              sub.fileUrl = `${hostBase}${parsed.pathname}`;
            }
          } catch (e) {
            if (typeof sub.fileUrl === 'string' && sub.fileUrl.startsWith('/uploads/')) {
              sub.fileUrl = `${hostBase}${sub.fileUrl}`;
            }
          }
        }
        return sub;
      });
    }

    res.json(obj);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/', adminAuth, async (req, res) => {
  try {
    const { title, description, fileType, dueDate, maxFileSize, allowedExtensions } = req.body;

    // Process allowedExtensions using helper function
    const processedExtensions = processAllowedExtensions(allowedExtensions);

    const assignment = new Assignment({
      title,
      description,
      fileType,
      dueDate: new Date(dueDate),
      maxFileSize: maxFileSize || 10,
      allowedExtensions: processedExtensions,
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

router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { title, description, fileType, dueDate, maxFileSize, allowedExtensions, isActive } = req.body;

    // Process allowedExtensions using helper function
    const processedExtensions = processAllowedExtensions(allowedExtensions);

    const updatedAssignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        fileType,
        dueDate: new Date(dueDate),
        maxFileSize,
        allowedExtensions: processedExtensions,
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

router.post('/:id/submit', auth, upload.single('file'), async (req, res) => {
  try {
    console.log('Assignment submission attempt:', {
      userId: req.user._id,
      assignmentId: req.params.id,
      userRole: req.user.role,
      hasFile: !!req.file,
      fileName: req.file?.originalname,
      body: req.body
    });

    if (req.user.role === 'admin') {
      return res.status(403).json({ message: 'Admins cannot submit assignments' });
    }

    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      console.log('Assignment not found:', req.params.id);
      return res.status(404).json({ message: 'Assignment not found' });
    }

    console.log('Assignment found:', {
      id: assignment._id,
      title: assignment.title,
      fileType: assignment.fileType,
      isActive: assignment.isActive,
      allowedExtensions: assignment.allowedExtensions
    });

    if (!assignment.isActive) {
      return res.status(403).json({ message: 'Assignment is not active' });
    }

    const existingSubmission = assignment.submissions.find(
      sub => sub.student.toString() === req.user._id.toString()
    );

    if (existingSubmission) {
      return res.status(400).json({ message: 'You have already submitted this assignment' });
    }

    if (assignment.fileType !== 'any' && assignment.fileType !== 'url') {
      if (!req.file) {
        return res.status(400).json({ message: 'File is required for this assignment' });
      }

      const fileExtension = path.extname(req.file.originalname).toLowerCase();
      
      // Debug logging
      console.log('File validation:', {
        fileName: req.file.originalname,
        fileExtension,
        allowedExtensions: assignment.allowedExtensions,
        assignmentFileType: assignment.fileType,
        isMatch: assignment.allowedExtensions.includes(fileExtension)
      });
      
      if (assignment.allowedExtensions.length > 0 && 
          !assignment.allowedExtensions.includes(fileExtension)) {
        return res.status(400).json({ 
          message: `File type not allowed. Allowed types: ${assignment.allowedExtensions.join(', ')}` 
        });
      }
    }

    if (assignment.fileType === 'url' && !req.body.url) {
      return res.status(400).json({ message: 'URL is required for this assignment' });
    }

    const hostBase = `${req.protocol}://${req.get('host')}`;
    const submission = {
      student: req.user._id,
      submittedAt: new Date(),
      fileUrl: req.file ? `${hostBase}/uploads/assignments/${req.file.filename}` : req.body.url,
      fileName: req.file ? req.file.originalname : req.body.url,
      fileType: req.file ? path.extname(req.file.originalname) : 'url',
      comments: req.body.comments || ''
    };

    assignment.submissions.push(submission);
    await assignment.save();

    console.log('Submission created successfully:', submission);
    res.status(201).json(submission);
  } catch (error) {
    console.error('Assignment submission error:', {
      error: error.message,
      stack: error.stack,
      assignmentId: req.params.id,
      userId: req.user?._id
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

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
