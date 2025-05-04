import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Appointment from './model/Appointment.js';
import sendReminder from './utils/sendReminder.js';

dotenv.config();

const log = (msg) => console.log(`[${new Date().toLocaleString()}] ${msg}`);

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/petopia', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

const handleReminders = async (appointments, label) => {
  log(`📋 Found ${appointments.length} appointments for ${label}`);
  for (const appointment of appointments) {
    const ownerEmail = appointment.owner_id?.email;
    const petOwnerName = appointment.owner_id?.name || 'Pet Owner';
    const clinicName = appointment.clinic_id?.name || 'Pet Clinic';
    const appointmentDate = appointment.date.toLocaleDateString();
    const appointmentTime = appointment.date.toLocaleTimeString();

    if (ownerEmail) {
      log(`📧 Sending ${label} reminder to ${ownerEmail}`);
      await sendReminder({ email: ownerEmail, petOwnerName, clinicName, date: appointmentDate, startTime: appointmentTime });
    } else {
      log('⚠️ Skipping reminder: No email found.');
    }
  }
};

export async function sendAppointmentReminders() {
  const now = new Date();
  const oneDay = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const fiveHours = new Date(now.getTime() + 5 * 60 * 60 * 1000);

  log('🔍 Looking for appointments...');

  const appointmentsTomorrow = await Appointment.find({ date: { $gte: now, $lt: oneDay } }).populate('owner_id clinic_id');
  await handleReminders(appointmentsTomorrow, '1-day');

  const appointmentsSoon = await Appointment.find({ date: { $gte: now, $lt: fiveHours } }).populate('owner_id clinic_id');
  await handleReminders(appointmentsSoon, '5-hour');

  log('✅ Done sending reminders.');
}

// If run directly from the command line
if (process.argv[1] === import.meta.url) {
  sendAppointmentReminders()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('💥 Reminder script error:', err);
      process.exit(1);
    });
}
