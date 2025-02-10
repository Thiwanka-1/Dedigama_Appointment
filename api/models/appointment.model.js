import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  appointmentName: { type: String, required: true },
  date: { type: Date, required: true },
  timeRange: {
    startTime: { type: String, required: true }, // Change to String
    endTime: { type: String, required: true }, // Change to String
  },
  reason: { type: String },
  withWhom: { type: String },
  appointmentNumber: { type: Number, required: true },
});

appointmentSchema.index({ appointmentNumber: 1 });  // Just remove the unique constraint if there is one

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;
