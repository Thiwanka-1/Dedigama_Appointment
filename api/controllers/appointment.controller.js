import Appointment from '../models/appointment.model.js';
import AppointmentRequest from '../models/appointmentReq.model.js';
import mongoose from 'mongoose';  // Ensure mongoose is imported
import cron from 'node-cron';
import nodemailer from 'nodemailer';
import User from '../models/user.model.js';


// Helper function to check if two time ranges overlap
const isOverlapping = (start1, end1, start2, end2) => {
  return (start1 < end2 && start2 < end1);
};

// Before adding an appointment
const checkAppointmentOverlap = async (date, startTime, endTime, excludedAppointmentId = null) => {
  const appointmentsForDay = await Appointment.find({
    date: { $gte: new Date(date).setHours(0, 0, 0, 0), $lt: new Date(date).setHours(23, 59, 59, 999) }
  });

  // Check for overlap with all appointments for the day
  for (const appointment of appointmentsForDay) {
    // Skip comparing the appointment with itself when updating
    if (appointment._id.toString() === excludedAppointmentId) {
      continue;
    }

    if (isOverlapping(
      new Date(`${date}T${startTime}`).getTime(),
      new Date(`${date}T${endTime}`).getTime(),
      new Date(`${date}T${appointment.timeRange.startTime}`).getTime(),
      new Date(`${date}T${appointment.timeRange.endTime}`).getTime()
    )) {
      throw new Error('The selected time is not free. Please choose another time.');
    }
  }
};

// Add appointment
export const addAppointment = async (req, res) => {
  try {
    const { appointmentName, date, timeRange, reason, withWhom } = req.body;

    // Check if the time range overlaps with existing appointments
    await checkAppointmentOverlap(date, timeRange.startTime, timeRange.endTime);

    // Proceed with creating the appointment as usual
    const [year, month, day] = date.split('-');
    const appointmentDate = new Date(Date.UTC(year, month - 1, day));
    appointmentDate.setUTCHours(0, 0, 0, 0); 

    const startTime = timeRange.startTime;
    const endTime = timeRange.endTime;

    const appointmentsForDay = await Appointment.find({
      date: { $gte: appointmentDate, $lt: new Date(appointmentDate).setDate(appointmentDate.getDate() + 1) },
    }).sort({ 'timeRange.startTime': 1 });

    const appointmentNumber = appointmentsForDay.length + 1;

    const newAppointment = new Appointment({
      appointmentName,
      date: appointmentDate,
      timeRange: { startTime, endTime },
      reason,
      withWhom,
      appointmentNumber,
    });

    await newAppointment.save();
    await reassignAppointmentNumbers(appointmentDate);

    return res.status(201).json({
      success: true,
      message: 'Appointment created successfully!',
      appointment: newAppointment,
    });
  } catch (err) {
    console.error('Error adding appointment:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'An unexpected error occurred while adding the appointment.',
    });
  }
};

// Update appointment
export const updateAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const { appointmentName, date, timeRange, reason, withWhom } = req.body;

    // Validate input data
    if (!appointmentName || !date || !timeRange || !timeRange.startTime || !timeRange.endTime || !reason || !withWhom) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    // Check if the appointment exists
    const appointmentToUpdate = await Appointment.findById(appointmentId);
    if (!appointmentToUpdate) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    const oldDate = appointmentToUpdate.date;
    
    // Check if the new time range overlaps with existing appointments
    try {
      await checkAppointmentOverlap(date, timeRange.startTime, timeRange.endTime, appointmentId);
    } catch (overlapError) {
      return res.status(409).json({ success: false, message: `Appointment time overlaps with another: ${overlapError.message}` });
    }

    // Update the appointment
    appointmentToUpdate.appointmentName = appointmentName;
    appointmentToUpdate.date = date;
    appointmentToUpdate.timeRange = timeRange;
    appointmentToUpdate.reason = reason;
    appointmentToUpdate.withWhom = withWhom;

    await appointmentToUpdate.save();

    // Reassign appointment numbers if the date has changed
    if (oldDate !== date) {
      const oldDateObj = new Date(oldDate);
      oldDateObj.setHours(0, 0, 0, 0);
      const newDateObj = new Date(date);
      newDateObj.setHours(0, 0, 0, 0);

      await reassignAppointmentNumbers(oldDateObj);
      await reassignAppointmentNumbers(newDateObj);
    } else {
      const currentDate = new Date(date);
      currentDate.setHours(0, 0, 0, 0);
      await reassignAppointmentNumbers(currentDate);
    }

    return res.status(200).json({
      success: true,
      message: 'Appointment updated and appointment numbers reassigned successfully!',
      appointment: appointmentToUpdate,
    });

  } catch (err) {
    console.error('Error updating appointment:', err);

    // Check if the error is related to invalid data (like date format, etc.)
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: 'Invalid input data', error: err.message });
    }

    // General error
    return res.status(500).json({
      success: false,
      message: 'Error updating appointment.',
      error: err.message,
    });
  }
};

const reassignAppointmentNumbers = async (currentDate) => {
  try {
    const appointmentsForDay = await Appointment.find({
      date: { $gte: currentDate, $lt: new Date(currentDate).setDate(currentDate.getDate() + 1) },
    }).sort({ 'timeRange.startTime': 1 });  // Sort by start time

    // Create an array of promises for updating the appointment numbers
    const updatePromises = appointmentsForDay.map((appointment, index) => {
      appointment.appointmentNumber = index + 1;  // Assign the correct appointment number
      return appointment.save();
    });

    // Wait for all updates to complete in parallel
    await Promise.all(updatePromises);

  } catch (err) {
    console.error('Error reassigning appointment numbers:', err);
  }
};

export const deleteAppointment = async (req, res) => {
  const { id } = req.params; // Extract the appointment ID from the request params

  try {
    // Step 1: Find and delete the appointment
    const appointmentToDelete = await Appointment.findById(id);
    
    if (!appointmentToDelete) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    // Step 2: Delete the appointment
    await Appointment.findByIdAndDelete(id);

    // Step 3: Reassign appointment numbers for the same date
    await reassignAppointmentNumbers(appointmentToDelete.date);

    return res.status(200).json({
      success: true,
      message: 'Appointment deleted and appointment numbers reassigned successfully!',
    });

  } catch (err) {
    console.error('Error deleting appointment:', err);
    return res.status(500).json({
      success: false,
      message: 'Error deleting appointment.',
    });
  }
};

// Get all appointments (with filtering by date)
export const getAppointments = async (req, res) => {
  try {
    const { date } = req.query; // Filtering by date (optional)

    let filter = {};
    if (date) {
      filter.date = { $gte: new Date(date) }; // filtering by date (only current/future dates)
    }

    const appointments = await Appointment.find(filter).sort({ date: 1, 'timeRange.startTime': 1 }); // Sort by date and time ascending
    res.status(200).json(appointments);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get a single appointment by ID
export const getAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    res.status(200).json(appointment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Helper function to format time as 'HH:mm' string
const formatTime = (date) => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

// Helper function to get available time slots
const getAvailableTimeSlots = async (date) => {
  const appointmentsForDay = await Appointment.find({
    date: { $gte: new Date(date).setHours(0, 0, 0, 0), $lt: new Date(date).setHours(23, 59, 59, 999) }
  }).sort({ 'timeRange.startTime': 1 });

  const workingStartTime = '09:00'; // Adjust according to your working hours
  const workingEndTime = '18:30'; // Adjust according to your working hours

  // Start and end times as Date objects
  let currentStartTime = new Date(`${date}T${workingStartTime}:00`);
  const availableSlots = [];

  // Loop through all appointments and check for free time slots
  appointmentsForDay.forEach((appointment) => {
    const appointmentStart = new Date(`${date}T${appointment.timeRange.startTime}:00`);
    const appointmentEnd = new Date(`${date}T${appointment.timeRange.endTime}:00`);

    // Check for available time before the current appointment
    if (currentStartTime < appointmentStart) {
      availableSlots.push({
        startTime: formatTime(currentStartTime),
        endTime: formatTime(appointmentStart),
      });
    }

    // Update currentStartTime to the end of the current appointment
    currentStartTime = appointmentEnd;
  });

  // Finally, check if there's time after the last appointment
  const workingEndTimeDate = new Date(`${date}T${workingEndTime}:00`);
  if (currentStartTime < workingEndTimeDate) {
    availableSlots.push({
      startTime: formatTime(currentStartTime),
      endTime: formatTime(workingEndTimeDate),
    });
  }

  return availableSlots;
};

// New endpoint for checking available time slots
export const checkAvailability = async (req, res) => {
  try {
    const { date } = req.query; // Expecting date in the query (e.g., '2025-02-10')

    if (!date) {
      return res.status(400).json({ success: false, message: 'Date is required.' });
    }

    const availableSlots = await getAvailableTimeSlots(date);

    if (availableSlots.length === 0) {
      return res.status(200).json({ success: true, message: 'No available time slots', availableSlots: [] });
    }

    return res.status(200).json({ success: true, availableSlots });
  } catch (err) {
    console.error('Error checking availability:', err);
    return res.status(500).json({
      success: false,
      message: 'Error checking availability.',
      error: err.message,
    });
  }
};

export const addAppointmentRequest = async (req, res) => {
  try {
    // Destructure necessary data from the request body
    const { appointmentName, date, timeRange, reason, withWhom } = req.body;

    // Log the incoming request for debugging

    // Get the authenticated user's ID from req.user (populated by verifyToken)
    const userId = req.user.id;  // Use req.user.id to get the user ID

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User is not authenticated.',
      });
    }

    // Ensure userId is a valid ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid User ID format.',
      });
    }

    // Correct way to create a new ObjectId
    const userObjectId = new mongoose.Types.ObjectId(userId); // Use the `new` keyword

    // Create a new appointment request with the validated userId
    const newRequest = new AppointmentRequest({
      appointmentName,
      date,
      timeRange,
      reason,
      withWhom,
      userId: userObjectId,  // Use the corrected ObjectId
    });

    // Save the new appointment request to the database
    await newRequest.save();

    return res.status(201).json({
      success: true,
      message: 'Appointment request created successfully!',
      appointmentRequest: newRequest,
    });
  } catch (err) {
    console.error('Error adding appointment request:', err);

    return res.status(500).json({
      success: false,
      message: err.message || 'An unexpected error occurred while creating the appointment request.',
    });
  }
};

// Get all appointment requests (with filtering by status)
export const getAppointmentRequests = async (req, res) => {
  try {
    const { status, date } = req.query;
    let filter = {};

    // Only apply filters if they are provided
    if (status) {
      filter.status = status;
    }
    if (date) {
      filter.date = { $gte: new Date(date) };
    }

    const appointmentRequests = await AppointmentRequest.find(filter).sort({ date: 1, 'timeRange.startTime': 1 });
    res.status(200).json(appointmentRequests);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};



// Get a single appointment request by ID
export const getAppointmentRequest = async (req, res) => {
  try {
    const appointmentRequest = await AppointmentRequest.findById(req.params.id);
    if (!appointmentRequest) {
      return res.status(404).json({ error: 'Appointment request not found' });
    }
    res.status(200).json(appointmentRequest);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Approve or reject appointment request
export const updateAppointmentRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be either approved or rejected.' });
    }

    const appointmentRequest = await AppointmentRequest.findById(id);
    if (!appointmentRequest) {
      return res.status(404).json({ success: false, message: 'Appointment request not found.' });
    }

    appointmentRequest.status = status;

    // If approved, create the actual appointment
    if (status === 'approved') {
      const { appointmentName, date, timeRange, reason, withWhom } = appointmentRequest;

      // Ensure no appointment overlaps
      await checkAppointmentOverlap(date, timeRange.startTime, timeRange.endTime);

      let appointmentDate;
      if (typeof date === 'string') {
        const [year, month, day] = date.split('-');
        appointmentDate = new Date(Date.UTC(year, month - 1, day));
      } else if (date instanceof Date) {
        appointmentDate = new Date(date);
      }
      appointmentDate.setUTCHours(0, 0, 0, 0);

      const startTime = timeRange.startTime;
      const endTime = timeRange.endTime;

      const appointmentsForDay = await Appointment.find({
        date: { $gte: appointmentDate, $lt: new Date(appointmentDate).setDate(appointmentDate.getDate() + 1) },
      }).sort({ 'timeRange.startTime': 1 });

      const appointmentNumber = appointmentsForDay.length + 1;

      const newAppointment = new Appointment({
        appointmentName,
        date: appointmentDate,
        timeRange: { startTime, endTime },
        reason,
        withWhom,
        appointmentNumber,
      });

      await newAppointment.save();
      await reassignAppointmentNumbers(appointmentDate);
    }

    await appointmentRequest.save();

    // Fetch the user email from the User model
    const user = await User.findById(appointmentRequest.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    const userEmail = user.email;

    // Create email transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'gamithu619@gmail.com',  // Your email
        pass: 'kgqk qrxx llgr zhhp',  // Your email password or app-specific password
      },
    });

    // Send email to the user based on the status
    const mailOptions = {
      from: 'gamithu619@gmail.com',
      to: userEmail, // Send to the user's email
      subject: `Appointment Request ${status === 'approved' ? 'Approved' : 'Rejected'}`,
      text: `Dear ${appointmentRequest.withWhom},\n\nYour appointment with the Managind Director(MD) request has been ${status}.`,
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Error sending email:', error);
      } else {
        console.log('Email sent:', info.response);
      }
    });

    return res.status(200).json({
      success: true,
      message: `Appointment request ${status} successfully!`,
      appointmentRequest,
    });
  } catch (err) {
    console.error('Error updating appointment request status:', err);
    return res.status(500).json({
      success: false,
      message: 'Error updating appointment request status.',
      error: err.message,
    });
  }
};



// Get appointment requests for the current user
export const getUserAppointmentRequests = async (req, res) => {
  try {
    const userId = req.user.id;  // Assuming the user is authenticated and their ID is available
    const appointmentRequests = await AppointmentRequest.find({ userId }).sort({ date: 1, 'timeRange.startTime': 1 });
    res.status(200).json(appointmentRequests);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};



// DELETE endpoint to cancel an appointment request
export const cancelAppointmentRequest = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`Request to cancel appointment with ID: ${id}`);

    // Validate the ID
    if (!id) {
      return res.status(400).json({ success: false, message: 'Appointment request ID is required.' });
    }

    const appointmentRequest = await AppointmentRequest.findById(id);
    console.log('Found appointment request:', appointmentRequest);

    // If no appointment is found, return a 404
    if (!appointmentRequest) {
      return res.status(404).json({ success: false, message: 'Appointment request not found.' });
    }

    // Check if the appointment status is 'pending'
    if (appointmentRequest.status !== 'pending') {
      console.log('Appointment status is not pending:', appointmentRequest.status);
      return res.status(400).json({ success: false, message: 'Only pending appointments can be cancelled.' });
    }

    // Delete the appointment request from the database
    await AppointmentRequest.deleteOne({ _id: id });

    console.log('Appointment cancelled successfully.');

    return res.status(200).json({
      success: true,
      message: 'Appointment request cancelled successfully.',
    });
  } catch (err) {
    console.error('Error cancelling appointment request:', err);
    return res.status(500).json({
      success: false,
      message: `Error cancelling appointment request: ${err.message || err}`,
    });
  }
};


export const deleteRejectedAppointments = async () => {
  try {
    const now = Date.now();
    const deletedAppointments = await AppointmentRequest.deleteMany({
      status: 'rejected',
      date: { $lt: new Date(now - 8640000000000) }, // 24 hours in milliseconds
    });

    console.log(`Deleted ${deletedAppointments.deletedCount} rejected appointments older than 24 hours.`);
  } catch (err) {
    console.error('Error deleting rejected appointments:', err);
  }
};

// Schedule the task to run every day at midnight (00:00)
cron.schedule('0 0 * * *', () => {
  console.log('Running scheduled task to delete rejected appointments older than 24 hours.');
  deleteRejectedAppointments();
});


