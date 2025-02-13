import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const AppointmentDetails = () => {
  const { id } = useParams(); // Get the appointment ID from the URL
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Track error state

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        const response = await axios.get(`https://dedigama-appointment.vercel.app//api/appointments/${id}`);
        setAppointment(response.data);
      } catch (error) {
        setError('Error fetching appointment details');
      } finally {
        setLoading(false);
      }
    };
    fetchAppointment();
  }, [id]);

  if (loading) return <div className="text-center text-gray-500">Loading...</div>;
  if (error) return <div className="text-red-500 text-center">{error}</div>;

  const handleDelete = async () => {
    const confirmDelete = window.confirm('Are you sure you want to delete this appointment?');
    if (confirmDelete) {
      try {
        await axios.delete(`https://dedigama-appointment.vercel.app//api/appointments/delete/${id}`);
        navigate('/appointments');
      } catch (error) {
        setError('Error deleting appointment');
      }
    }
  };

  const handleUpdate = () => {
    navigate(`/appointment-update/${id}`);
  };

  if (!appointment) return <div className="text-center text-gray-500">Loading...</div>;

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100 py-12 px-6">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-2xl">
        <h2 className="text-3xl font-semibold text-gray-800 mb-6 text-center">Appointment Details</h2>

        <div className="space-y-4">
          <div className="flex justify-between">
            <p className="font-medium text-gray-700"><strong>Appointment Number:</strong></p>
            <p className="text-gray-600">{appointment.appointmentNumber}</p>
          </div>

          <div className="flex justify-between">
            <p className="font-medium text-gray-700"><strong>Appointment Name:</strong></p>
            <p className="text-gray-600">{appointment.appointmentName}</p>
          </div>

          <div className="flex justify-between">
            <p className="font-medium text-gray-700"><strong>Date:</strong></p>
            <p className="text-gray-600">{new Date(appointment.date).toLocaleDateString()}</p>
          </div>

          <div className="flex justify-between">
            <p className="font-medium text-gray-700"><strong>Time:</strong></p>
            <p className="text-gray-600">{appointment.timeRange.startTime} - {appointment.timeRange.endTime}</p>
          </div>

          <div className="flex justify-between">
            <p className="font-medium text-gray-700"><strong>Reason:</strong></p>
            <p className="text-gray-600">{appointment.reason}</p>
          </div>

          <div className="flex justify-between">
            <p className="font-medium text-gray-700"><strong>With:</strong></p>
            <p className="text-gray-600">{appointment.withWhom}</p>
          </div>
        </div>

        <div className="flex justify-between mt-8">
          <button 
            onClick={handleUpdate} 
            className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-all w-1/3"
          >
            Update
          </button>
          <button 
            onClick={handleDelete} 
            className="bg-red-600 text-white py-2 px-6 rounded-lg hover:bg-red-700 transition-all w-1/3"
          >
            Delete
          </button>
        </div>

        <div className="mt-4 text-center">
          <button 
            onClick={() => navigate('/appointments')} 
            className="bg-gray-400 text-white py-2 px-6 rounded-lg hover:bg-gray-500 transition-all"
          >
            Back to Appointments
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetails;
