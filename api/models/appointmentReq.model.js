import mongoose from 'mongoose';

const appointmentRequestSchema = new mongoose.Schema({
  appointmentName: { type: String, required: true },
  date: { type: Date, required: true },
  timeRange: {
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
  },
  reason: { type: String },
  withWhom: { type: String, required: true }, // Name entered by the user
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending', 
  },
  appointmentNumber: { type: Number, default: null }, // Will be assigned once approved
  createdAt: { type: Date, default: Date.now }, // Automatically set to the current date/time
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },  // ObjectId for user
});

// Create an index for faster queries based on date and time
appointmentRequestSchema.index({ date: 1, timeRange: 1 });

const AppointmentRequest = mongoose.model('AppointmentRequest', appointmentRequestSchema);

export default AppointmentRequest;
