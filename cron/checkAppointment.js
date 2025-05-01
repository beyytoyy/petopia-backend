import cron from 'node-cron';
import Appointment from '../model/Appointment.js';
import sendReminder from '../utils/sendReminder.js';

function formatTo12Hour(timeString) {
  if (!timeString) {
    console.warn('No time string provided to formatTo12Hour');
    return 'Time not available'; // or handle it as you see fit
  }

  console.log('Formatting time:', timeString); // Log the value to see what's being passed

  const [hours, minutes] = timeString.split(':');
  const date = new Date();
  date.setHours(hours);
  date.setMinutes(minutes);

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();
    const localNow = now.toLocaleString('en-US', { timeZone: 'Asia/Manila' });

    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const fiveHoursFromNow = new Date(now.getTime() + 5 * 60 * 60 * 1000);
    
    const oneDayAppointments = await Appointment.find({
      status: 'Confirmed',
      date: {
        $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0),
        $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 0, 0, 0)
      },
      hasSentOneDayReminder: { $ne: true }
    })
    .populate('owner_id', 'email name') // populate email and name
    .populate('clinic_id', 'name'); // populate clinic name

    for (const appointment of oneDayAppointments) {
      if (!appointment.owner_id?.email || !appointment.clinic_id?.name || !appointment.startTime) {
        console.warn('No start time for appointment', appointment);
        continue; // Skip this appointment if there's no start time
      }
    
      const startTime = appointment.startTime;
      await sendReminder({
        email: appointment.owner_id.email,
        petOwnerName: appointment.owner_id.name || 'Pet Owner',
        clinicName: appointment.clinic_id.name,
        date: appointment.date,
        startTime: formatTo12Hour(startTime)
      });
    
      appointment.hasSentOneDayReminder = true;
      await appointment.save();
    }
    
    
    const fiveHoursAppointments = await Appointment.find({
      status: 'Confirmed',
      date: {
        $gte: new Date(fiveHoursFromNow.getTime() - (30 * 60 * 1000)),
        $lte: fiveHoursFromNow
      },
      hasSentFiveHoursReminder: { $ne: true }
    })
    .populate('owner_id', 'email name')
    .populate('clinic_id', 'name');

    for (const appointment of fiveHoursAppointments) {
      if (!appointment.owner_id?.email || !appointment.clinic_id?.name) {
        continue;
      }

      const startTime = appointment.startTime; // Ensure this field exists
      await sendReminder({
        email: appointment.owner_id.email,
        petOwnerName: appointment.owner_id.name || 'Pet Owner',
        clinicName: appointment.clinic_id.name,
        date: appointment.date,
        startTime: formatTo12Hour(startTime) // Check if startTime is defined
      });
      appointment.hasSentFiveHoursReminder = true;
      await appointment.save();
    }
    
  } catch (error) {
    console.error('[CRON ERROR]', error);
  }
});