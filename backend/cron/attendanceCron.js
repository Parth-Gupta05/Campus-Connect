const cron = require('node-cron');
const Event = require('../models/Event');

// Run every hour at minute 0
cron.schedule('0 * * * *', async () => {
  console.log('[Cron] Running attendance cleanup job...');
  try {
    const now = new Date();
    
    // Find events that are not completed
    const events = await Event.find({ status: { $in: ['upcoming', 'ongoing'] } });
    
    for (const event of events) {
      const eventDateTime = new Date(event.date);
      const [hours, minutes] = event.time.split(':');
      eventDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

      // If the event ended more than 2 hours ago
      if (now.getTime() > eventDateTime.getTime() + (2 * 60 * 60 * 1000)) {
        let changed = false;
        
        for (const student of event.registeredStudents) {
          if (student.attendanceStatus === 'pending') {
            student.attendanceStatus = 'absent';
            changed = true;
          }
        }
        
        event.status = 'completed';
        changed = true;

        if (changed) {
          await event.save();
          console.log(`[Cron] Marked absentees and completed event: ${event.title}`);
        }
      }
    }
  } catch (error) {
    console.error('[Cron Error] Failed to process attendance:', error);
  }
});
