import { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment-timezone'; // Import moment-timezone

const AppointmentForm = () => {
  const [appointmentName, setAppointmentName] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');
  const [withWhom, setWithWhom] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [appointmentDetails, setAppointmentDetails] = useState({});
  const [submitError, setSubmitError] = useState('');

  const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format

  const handleWithWhomChange = (e) => {
    const value = e.target.value;
    const regex = /^[A-Za-z. ]*$/;
    if (regex.test(value) || value === '') {
      setWithWhom(value);
      setErrorMessage('');
    } else {
      setErrorMessage('Only letters and periods are allowed in "With Whom" field');
    }
  };

  const fetchAppointments = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/appointments/get');
      setAppointments(response.data);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prepare appointmentData object
    const appointmentData = {
      appointmentName,
      date,
      timeRange: { startTime, endTime },
      reason,
      withWhom
    };

    // Check if appointmentData is correctly set
    if (!appointmentData.date || !appointmentData.timeRange.startTime || !appointmentData.timeRange.endTime) {
      setSubmitError('Please fill in all fields before submitting.');
      return;
    }

    // Convert the start and end time into proper date-time objects
    const startDateTime = moment(`${appointmentData.date}T${appointmentData.timeRange.startTime}`);
    const endDateTime = moment(`${appointmentData.date}T${appointmentData.timeRange.endTime}`);

    // Check for overlapping appointment before submission
    const isOverlapping = appointments.some(appointment => {
      const existingStartTime = moment(appointment.date + 'T' + appointment.timeRange.startTime);
      const existingEndTime = moment(appointment.date + 'T' + appointment.timeRange.endTime);

      return (startDateTime.isBefore(existingEndTime) && endDateTime.isAfter(existingStartTime));
    });

    if (isOverlapping) {
      setSubmitError('The selected time overlaps with an existing appointment. Please choose another time.');
      return;
    }

    // Proceed with submitting appointment
    try {
      const response = await axios.post('http://localhost:3000/api/appointments/add', appointmentData);

      // Handle success
      setAppointmentDetails(response.data.appointment);
      setShowPopup(true);
      clearForm();
      fetchAppointments();
    } catch (error) {
      console.error("Error details:", error);

      // Handle error
      if (error.response) {
        setSubmitError(error.response.data.message || 'There was an error adding the appointment. Please try again.');
      } else if (error.request) {
        setSubmitError('Network error: No response from the server. Please check your internet connection and try again.');
      } else {
        setSubmitError('An error occurred while setting up the request. Please try again later.');
      }
    }
  };

  const clearForm = () => {
    setAppointmentName('');
    setDate('');
    setStartTime('');
    setEndTime('');
    setReason('');
    setWithWhom('');
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  return (
    <div>
      <form onSubmit={handleSubmit} className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-lg space-y-6">
        <h2 className="text-3xl font-semibold text-center text-gray-800 mb-6">Add Appointment</h2>

        <div className="flex flex-col space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Appointment Name</label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={appointmentName}
              onChange={(e) => setAppointmentName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={today} 
              required
            />
          </div>

          <div className="flex space-x-4">
            <div className="w-1/2">
              <label className="block text-sm font-medium text-gray-700">Start Time</label>
              <input
                type="time"
                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="w-1/2">
              <label className="block text-sm font-medium text-gray-700">End Time</label>
              <input
                type="time"
                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Reason</label>
            <select
              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            >
              <option value="">Select a reason</option>
              <option value="Visitors">Visitors</option>
              <option value="Head Office Interview">Head Office Interview</option>
              <option value="Branch Interview">Branch Interview</option>
              <option value="Manager Interview">Manager Interview</option>
              <option value="Head Ofiice Staff">Head Ofiice Staff</option>
              <option value="Staff Meeting">Staff Meeting</option>
              <option value="Manager Meeting">Manager Meeting</option>
              <option value="Urgent Meeting">Urgent Meeting</option>
              <option value="Gem Meeting">Gem Meeting</option>
              <option value="Document Signing">Document Signing</option>
              <option value="Gem Validation">Gem Validation</option>
              <option value="Hotel Meeting">Hotel Meeting</option>
              <option value="Audit Meeting">Audit Meeting</option>
              <option value="IT Meeting">IT Meeting</option>
              <option value="Procument Meeting">Procument Meeting</option>
              <option value="Jewelery Meeting">Jewelery Meeting</option>
              <option value="Property Meeting">Property Meeting</option>
              <option value="Finance Meeting">Finance Meeting</option>
              <option value="RM Meeting">RM Meeting</option>
              <option value="ARM Meeting">ARM Meeting</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">With Whom</label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={withWhom}
              onChange={handleWithWhomChange}
              required
            />
            {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}
          </div>

          <button type="submit" className="w-full p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
            Add Appointment
          </button>
        </div>
      </form>

      {/* Popup */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-2xl font-bold text-center mb-4">Appointment Added</h3>
            <p><strong>Appointment Number:</strong> {appointmentDetails.appointmentNumber}</p>
            <p><strong>Appointment Name:</strong> {appointmentDetails.appointmentName}</p>
            <p><strong>Date:</strong> {appointmentDetails.date}</p>
            <p><strong>Time Range:</strong> {appointmentDetails.timeRange.startTime} - {appointmentDetails.timeRange.endTime}</p>
            <p><strong>With Whom:</strong> {appointmentDetails.withWhom}</p>
            <button
              onClick={closePopup}
              className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold mt-4 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Error message */}
      {submitError && (
        <div className="text-center text-red-500 mt-4">{submitError}</div>
      )}
    </div>
  );
};

export default AppointmentForm;
