const cron = require('node-cron');
const Event = require('../models/Event');

// Run every 15 minutes
cron.schedule('*/15 * * * *', async () => {
  console.log('[Cron] Running event lifecycle & attendance cleanup job...');
  try {
    const now = new Date();
    
    // Find events that are not completed
    const events = await Event.find({ status: { $in: ['upcoming', 'ongoing'] } });
    
    for (const event of events) {
      const eventStart = new Date(event.date);
      const [hours, minutes] = event.time.split(':');
      eventStart.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

      // Duration logic (fallback to 2 hours if not present)
      const durationHours = event.durationHours || 2;
      const eventEnd = new Date(eventStart.getTime() + (durationHours * 60 * 60 * 1000));
      
      // 2 Hour Grace Period for attendance sealing
      const eventSealingTime = new Date(eventEnd.getTime() + (2 * 60 * 60 * 1000));

      let changed = false;

      if (event.status === 'upcoming') {
        if (now >= eventStart && now < eventSealingTime) {
          event.status = 'ongoing';
          changed = true;
          console.log(`[Cron] Event started, marked ongoing: ${event.title}`);
        } else if (now >= eventSealingTime) {
          // Edge case where an event was somehow never marked ongoing and is already past grace period
          event.status = 'completed';
          changed = true;
        }
      }

      if (event.status === 'ongoing' || (event.status === 'completed' && changed)) {
        if (now >= eventSealingTime) {
          // Seal attendance
          for (const student of event.registeredStudents) {
            if (student.attendanceStatus === 'pending') {
              student.attendanceStatus = 'absent';
              changed = true;
            }
          }
          event.status = 'completed';
          changed = true;
          console.log(`[Cron] Marked absentees and completed event: ${event.title}`);
        }
      }

      if (changed) {
        await event.save();
      }
    }
  } catch (error) {
    console.error('[Cron Error] Failed to process event lifecycle:', error);
  }
});
