import cron from 'node-cron';
import sendAppointmentReminders from '../reminder.js'; // Adjust the path as necessary

// Schedule the job to run every hour
cron.schedule('0 * * * *', () => {
    console.log('Checking for upcoming appointments...');
    sendAppointmentReminders();
});