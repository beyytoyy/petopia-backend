import cron from 'node-cron';
import { sendAppointmentReminders } from '../reminder.js';

// Schedule to run every hour
cron.schedule('0 * * * *', () => {
  console.log('⏰ Cron triggered: checking appointments...');
  sendAppointmentReminders();
});
