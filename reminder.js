// reminder.js
import mongoose from 'mongoose';
import Appointment from './model/Appointment.js'; // Adjust the path as necessary
import sendReminder from './utils/sendReminder.js'; // Import the updated sendReminder function

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Function to send appointment reminders
const sendAppointmentReminders = async () => {
    const now = new Date();
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day
    const fiveHoursFromNow = new Date(now.getTime() + 5 * 60 * 60 * 1000); // 5 hours

    // Find appointments for the next day
    const appointmentsTomorrow = await Appointment.find({
        date: {
            $gte: now,
            $lt: oneDayFromNow,
        },
    });

    // Find appointments for the next 5 hours
    const appointmentsInFiveHours = await Appointment.find({
        date: {
            $gte: now,
            $lt: fiveHoursFromNow,
        },
    });

    // Send reminders for appointments tomorrow
    for (const appointment of appointmentsTomorrow) {
        const ownerEmail = appointment.owner.email; // Adjust based on your data structure
        const petOwnerName = appointment.owner.name; // Assuming you have a name field
        const clinicName = appointment.clinic.name; // Assuming you have a clinic field
        const appointmentDate = appointment.date.toLocaleDateString(); // Format date as needed
        const appointmentTime = appointment.date.toLocaleTimeString(); // Format time as needed

        await sendReminder({
            email: ownerEmail,
            petOwnerName: petOwnerName,
            clinicName: clinicName,
            date: appointmentDate,
            startTime: appointmentTime,
        });
    }

    // Send reminders for appointments in the next 5 hours
    for (const appointment of appointmentsInFiveHours) {
        const ownerEmail = appointment.owner.email; // Adjust based on your data structure
        const petOwnerName = appointment.owner.name; // Assuming you have a name field
        const clinicName = appointment.clinic.name; // Assuming you have a clinic field
        const appointmentDate = appointment.date.toLocaleDateString(); // Format date as needed
        const appointmentTime = appointment.date.toLocaleTimeString(); // Format time as needed

        await sendReminder({
            email: ownerEmail,
            petOwnerName: petOwnerName,
            clinicName: clinicName,
            date: appointmentDate,
            startTime: appointmentTime,
        });
    }
};

// Export the function to be used in the cron job
export default sendAppointmentReminders;