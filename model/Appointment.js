import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    owner_id: { type: mongoose.Schema.Types.ObjectId, ref: "Owner", required: false },
    pet_id: { type: mongoose.Schema.Types.ObjectId, ref: "Pet", required: false },
    guest_id: { type: mongoose.Schema.Types.ObjectId, ref: "Guest" },
    clinic_id: { type: mongoose.Schema.Types.ObjectId, ref: "Clinic", required: true },
    vet_id: { type: mongoose.Schema.Types.ObjectId, ref: "Veterinarian", required: false },
    service_id: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },
    date: { type: Date, required: true }, // Ensure this field is required
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "In-progress", "Ready-for-pickup", "Completed", "Canceled"],
      default: "Pending",
    },
    notes: String,
    medical_concern: String,
    confirmedAt: Date,
    completedAt: Date,
    rejectedAt: Date,
    price: { type: String },

    // OTP fields
    otp: { type: String },
    otpExpires: { type: Date },
    isVerified: { type: Boolean, default: false },

    reminder1DaySent: { type: Boolean, default: false },
    reminder5HourSent: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtuals for formatted date and time (12-hour format)
appointmentSchema.virtual("formattedDate").get(function () {
  if (!this.date) return null;
  return this.date.toLocaleDateString("en-US", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
});

appointmentSchema.virtual("formattedTime").get(function () {
  if (!this.date) return null;
  return this.date.toLocaleTimeString("en-US", {
    timeZone: "Asia/Manila",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
});

export default mongoose.model("Appointment", appointmentSchema);