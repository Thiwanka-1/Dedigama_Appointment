import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const AppointmentUpdate = () => {
  const { id } = useParams(); // Get the appointment ID from the URL
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState({
    appointmentNumber: '',
    appointmentName: '',
    date: '',
    startTime: '',
    endTime: '',
    reason: '',
    withWhom: '',
    timeRange: { startTime: '', endTime: '' }, // Initialize timeRange as an object
  });
  const [loading, setLoading] = useState(true); // Track loading state
  const [error, setError] = useState(null); // Track error state

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/api/appointments/${id}`);
        const data = response.data;

        // Convert the date into the correct format (yyyy-MM-dd)
        const formattedDate = new Date(data.date).toISOString().split('T')[0];

        // Set initial state with formatted values
        setAppointment({
          ...data,
          date: formattedDate,
          startTime: data.timeRange?.startTime || '',
          endTime: data.timeRange?.endTime || '',
          timeRange: { startTime: data.timeRange?.startTime || '', endTime: data.timeRange?.endTime || '' }, // Initialize timeRange object
        });
        setLoading(false); // Data fetched successfully, set loading to false
      } catch (error) {
        setError('Error fetching appointment details');
        setLoading(false); // Stop loading if error occurs
      }
    };
    fetchAppointment();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Prepare the timeRange object
      const updatedAppointment = {
        ...appointment,
        timeRange: { startTime: appointment.startTime, endTime: appointment.endTime }, // Ensure timeRange is an object
      };

      // Make the API call to update the appointment
      await axios.put(`http://localhost:3000/api/appointments/update/${id}`, updatedAppointment);

      // Navigate to the updated appointment's page
      navigate(`/appointments/${id}`);
    } catch (error) {
      // Handle the error if the time overlaps (409 Conflict)
      if (error.response && error.response.status === 409) {
        setError(error.response.data.message || 'The selected time is not free. Please choose another time.');
      } else {
        setError('Error updating appointment');
      }
    }
  };

  // Ensure that loading, error states are handled correctly
  if (loading) return <div className="text-center text-gray-700">Loading...</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-semibold text-center text-gray-800 mb-6">Update Appointment</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Appointment Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Appointment Number</label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-lg"
              value={appointment.appointmentNumber}
              readOnly
            />
          </div>

          {/* Appointment Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Appointment Name</label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-lg"
              value={appointment.appointmentName}
              onChange={(e) => setAppointment({ ...appointment, appointmentName: e.target.value })}
              required
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              className="w-full p-3 border border-gray-300 rounded-lg"
              value={appointment.date}
              onChange={(e) => setAppointment({ ...appointment, date: e.target.value })}
              required
            />
          </div>

          {/* Start Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Time</label>
            <input
              type="time"
              className="w-full p-3 border border-gray-300 rounded-lg"
              value={appointment.startTime}
              onChange={(e) => setAppointment({ ...appointment, startTime: e.target.value })}
              required
            />
          </div>

          {/* End Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700">End Time</label>
            <input
              type="time"
              className="w-full p-3 border border-gray-300 rounded-lg"
              value={appointment.endTime}
              onChange={(e) => setAppointment({ ...appointment, endTime: e.target.value })}
              required
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Reason</label>
            <select
              className="w-full p-3 border border-gray-300 rounded-lg"
              value={appointment.reason}
              onChange={(e) => setAppointment({ ...appointment, reason: e.target.value })}
              required
            >
              <option value="">Select a reason</option>
              <option value="Visitors">Visitors</option>
              <option value="Head Office Interview">Head Office Interview</option>
              <option value="Branch Interview">Branch Interview</option>
              <option value="Manager Interview">Manager Interview</option>
              <option value="Head Ofiice Staff">Head Office Staff</option>
              <option value="Staff Meeting">Staff Meeting</option>
              <option value="Manager Meeting">Manager Meeting</option>
              <option value="Urgent Meeting">Urgent Meeting</option>
              <option value="Gem Meeting">Gem Meeting</option>
              <option value="Document Signing">Document Signing</option>
              <option value="Gem Validation">Gem Validation</option>
              <option value="Hotel Meeting">Hotel Meeting</option>
              <option value="Audit Meeting">Audit Meeting</option>
              <option value="IT Meeting">IT Meeting</option>
              <option value="Procurement Meeting">Procurement Meeting</option>
              <option value="Jewelry Meeting">Jewelry Meeting</option>
              <option value="Property Meeting">Property Meeting</option>
              <option value="Finance Meeting">Finance Meeting</option>
              <option value="RM Meeting">RM Meeting</option>
              <option value="ARM Meeting">ARM Meeting</option>
            </select>
          </div>

          {/* With Whom */}
          <div>
            <label className="block text-sm font-medium text-gray-700">With Whom</label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-lg"
              value={appointment.withWhom}
              onChange={(e) => setAppointment({ ...appointment, withWhom: e.target.value })}
              required
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-between">
            <button
              type="submit"
              className="bg-blue-500 text-white px-6 py-3 rounded-lg"
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={() => navigate(`/appointments/${id}`)}
              className="bg-gray-400 text-white px-6 py-3 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Error Message Display */}
        {error && (
          <div className="mt-4 text-red-500 text-center">
            <p>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentUpdate;
