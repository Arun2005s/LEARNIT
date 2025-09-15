const express = require('express');
const Course = require('../models/Course');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const courses = await Course.find({ isActive: true })
      .populate('instructor', 'username fullName')
      .sort({ createdAt: -1 });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'username fullName')
      .populate('students', 'username fullName');
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/', adminAuth, async (req, res) => {
  try {
    const { title, description, code, instructor, category, level, maxStudents, startDate, endDate } = req.body;

    const existingCourse = await Course.findOne({ code });
    if (existingCourse) {
      return res.status(400).json({ message: 'Course with this code already exists' });
    }

    const course = new Course({
      title,
      description,
      code,
      instructor: instructor || req.user._id,
      category: category || 'General',
      level: level || 'Beginner',
      maxStudents: maxStudents || 100,
      startDate: startDate || new Date(),
      endDate: endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      isActive: true
    });

    await course.save();

    const populatedCourse = await Course.findById(course._id)
      .populate('instructor', 'username fullName');

    res.status(201).json(populatedCourse);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (req.user.role !== 'admin' && !course.instructor.equals(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('instructor', 'username fullName');

    res.json(updatedCourse);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    await Course.findByIdAndDelete(req.params.id);
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/:id/enroll', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (!course.isActive) {
      return res.status(400).json({ message: 'Course is not active' });
    }

    if (course.students.includes(req.user._id)) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }

    if (course.students.length >= course.maxStudents) {
      return res.status(400).json({ message: 'Course is full' });
    }

    course.students.push(req.user._id);
    await course.save();

    res.json({ message: 'Enrolled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
