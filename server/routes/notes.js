const express = require('express');
const Note = require('../models/Note');
const Course = require('../models/Course');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get all notes (with filtering)
router.get('/', auth, async (req, res) => {
  try {
    const { course, search, tags } = req.query;
    let query = {};

    // Filter by course
    if (course) {
      query.course = course;
    }

    // Search in title and content
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by tags
    if (tags) {
      query.tags = { $in: tags.split(',') };
    }

    // Check access permissions
    if (req.user.role !== 'admin') {
      query.$or = [
        { isPublic: true },
        { 'accessList.user': req.user._id },
        { author: req.user._id }
      ];
    }

    const notes = await Note.find(query)
      .populate('author', 'username fullName')
      .populate('course', 'title code')
      .populate('accessList.user', 'username fullName')
      .populate('comments.user', 'username fullName')
      .sort({ createdAt: -1 });

    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single note by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id)
      .populate('author', 'username fullName')
      .populate('course', 'title code')
      .populate('accessList.user', 'username fullName')
      .populate('comments.user', 'username fullName');

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Check access permissions
    if (req.user.role !== 'admin' && 
        !note.isPublic && 
        !note.accessList.some(access => access.user._id.equals(req.user._id)) &&
        !note.author._id.equals(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Increment view count
    note.viewCount += 1;
    await note.save();

    res.json(note);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new note (admin only)
router.post('/', adminAuth, async (req, res) => {
  try {
    const { title, content, course, tags, isPublic, accessList } = req.body;

    // Verify course exists if provided
    if (course) {
      const courseExists = await Course.findById(course);
      if (!courseExists) {
        return res.status(404).json({ message: 'Course not found' });
      }
    }

    const note = new Note({
      title,
      content,
      course,
      author: req.user._id,
      tags: tags || [],
      isPublic: isPublic !== undefined ? isPublic : true,
      accessList: accessList || []
    });

    await note.save();

    const populatedNote = await Note.findById(note._id)
      .populate('author', 'username fullName')
      .populate('course', 'title code');

    res.status(201).json(populatedNote);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update note (admin, author, or users with edit access)
router.put('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Check permissions
    let hasAccess = false;
    
    // Admin always has access
    if (req.user.role === 'admin') {
      hasAccess = true;
    }
    // Author has access
    else if (note.author.equals(req.user._id)) {
      hasAccess = true;
    }
    // Check access list for edit permission
    else if (note.accessList && note.accessList.length > 0) {
      const userAccess = note.accessList.find(access => 
        access.user.toString() === req.user._id.toString() && 
        access.accessType === 'edit'
      );
      hasAccess = !!userAccess;
    }

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedNote = await Note.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('author', 'username fullName')
     .populate('course', 'title code');

    res.json(updatedNote);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete note (admin or author only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Check permissions
    if (req.user.role !== 'admin' && !note.author.equals(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Note.findByIdAndDelete(req.params.id);
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add comment to note
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { content } = req.body;
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Check access permissions
    if (req.user.role !== 'admin' && 
        !note.isPublic && 
        !note.accessList.some(access => access.user.equals(req.user._id)) &&
        !note.author.equals(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    note.comments.push({
      user: req.user._id,
      content
    });

    await note.save();

    const populatedNote = await Note.findById(note._id)
      .populate('comments.user', 'username fullName');

    res.json(populatedNote.comments[populatedNote.comments.length - 1]);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update comment
router.put('/:id/comments/:commentId', auth, async (req, res) => {
  try {
    const { content } = req.body;
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    const comment = note.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check permissions
    if (req.user.role !== 'admin' && !comment.user.equals(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    comment.content = content;
    comment.updatedAt = Date.now();

    await note.save();

    const populatedNote = await Note.findById(note._id)
      .populate('comments.user', 'username fullName');

    res.json(comment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete comment
router.delete('/:id/comments/:commentId', auth, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    const comment = note.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check permissions
    if (req.user.role !== 'admin' && !comment.user.equals(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    comment.remove();
    await note.save();

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
