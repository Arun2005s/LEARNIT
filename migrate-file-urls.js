// Migration script to update existing file URLs from relative to absolute
const mongoose = require('mongoose');
const Assignment = require('./server/models/Assignment');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/learnit', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('Connected to MongoDB');
  
  try {
    // Find all assignments with submissions
    const assignments = await Assignment.find({
      'submissions.0': { $exists: true }
    });
    
    console.log(`Found ${assignments.length} assignments with submissions`);
    
    let updatedCount = 0;
    
    for (const assignment of assignments) {
      let assignmentUpdated = false;
      
      for (const submission of assignment.submissions) {
        // Check if the fileUrl is relative (starts with /uploads)
        if (submission.fileUrl && submission.fileUrl.startsWith('/uploads/')) {
          // Convert to absolute URL
          submission.fileUrl = `http://localhost:5000${submission.fileUrl}`;
          assignmentUpdated = true;
          console.log(`Updated submission: ${submission.fileName} -> ${submission.fileUrl}`);
        }
      }
      
      if (assignmentUpdated) {
        await assignment.save();
        updatedCount++;
        console.log(`Updated assignment: ${assignment.title}`);
      }
    }
    
    console.log(`Migration completed! Updated ${updatedCount} assignments`);
    process.exit(0);
    
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});
