import express from 'express';
import { 
  addAppointment, 
  getAppointments, 
  getAppointment, 
  updateAppointment, 
  deleteAppointment, 
  checkAvailability,
  addAppointmentRequest,  // Newly added function
  getAppointmentRequests, // Newly added function
  getAppointmentRequest,  // Newly added function
  updateAppointmentRequestStatus, // Newly added function
  getUserAppointmentRequests,
  cancelAppointmentRequest,
  deleteRejectedAppointments

} from '../controllers/appointment.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();
router.get('/user',verifyToken, getUserAppointmentRequests);

// Route to check availability of appointments (existing functionality)
router.get('/check-availability', checkAvailability);

// Route to add a new appointment (existing functionality)
router.post('/add', addAppointment);

// Route to add a new appointment request (new functionality)
router.post('/request', verifyToken, addAppointmentRequest);

// Route to get all appointment requests (new functionality)
router.get('/requests', getAppointmentRequests);

// Route to get all appointments (optional query to filter by date) (existing functionality)
router.get('/get', getAppointments);

// Route to get a single appointment by ID (existing functionality)
router.get('/:id', getAppointment);

// Route to update an appointment by ID (existing functionality)
router.put('/update/:id', updateAppointment);

// Route to delete an appointment by ID (existing functionality)
router.delete('/delete/:id', deleteAppointment);

// Route to get a single appointment request by ID (new functionality)
router.get('/request/:id', getAppointmentRequest);

// Route to update the status of an appointment request (new functionality)
router.put('/request/:id/status', updateAppointmentRequestStatus);

router.delete('/req-delete/:id', deleteRejectedAppointments);

router.delete('/cancel/:id', cancelAppointmentRequest);

export default router;
