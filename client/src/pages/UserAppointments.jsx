import React, { useEffect, useState } from 'react';
import axios from 'axios';

const UserAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState(null);

  // Function to fetch appointments for the current user
  const fetchAppointments = async () => {
    try {
      const response = await axios.get('https://dedigama-appointment.vercel.app/api/appointments/user',{
        withCredentials: true,
      });
      setAppointments(response.data);
    } catch (err) {
      setError('Error fetching appointments');
    } finally {
      setLoading(false);
    }
  };

  // Function to cancel an appointment request
  const cancelAppointment = async (id) => {
    try {
      await axios.delete(`https://dedigama-appointment.vercel.app/api/appointments/cancel/${id}`);
      setAppointments(appointments.filter((appointment) => appointment._id !== id)); // Update state to reflect cancellation
    } catch (err) {
      setError('Error cancelling appointment');
    }
  };

  // Function to show confirmation modal
  const confirmDelete = (id) => {
    setAppointmentToDelete(id);
    setShowModal(true);
  };

  const handleDelete = () => {
    if (appointmentToDelete) {
      cancelAppointment(appointmentToDelete);
      setShowModal(false);
      setAppointmentToDelete(null);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setAppointmentToDelete(null);
  };

  // Function to automatically delete rejected requests after 24 hours
  // Function to automatically delete rejected requests after 24 hours
const deleteRejectedAppointments = () => {
    const now = Date.now();
    const updatedAppointments = appointments.filter((appointment) => {
      if (
        appointment.status === 'rejected' &&
        now - new Date(appointment.date).getTime() > 8640000000000 // 24 hours in ms
      ) {
        // Delete from API
        axios.delete(`https://dedigama-appointment.vercel.app/api/appointments/req-delete/${appointment._id}`)
          .then(() => {
            // Ensure deletion is reflected in the state
            setAppointments(prevAppointments =>
              prevAppointments.filter(item => item._id !== appointment._id)
            );
          })
          .catch((err) => {
            console.error('Error deleting appointment from backend:', err);
          });
        return false; // Remove the rejected appointment from the list
      }
      return true; // Keep the rest of the appointments
    });
  
    setAppointments(updatedAppointments); // Update state with the remaining appointments
  };
  

  // Fetch appointments when component is mounted
  useEffect(() => {
    fetchAppointments();
  }, []);

  // Run the rejection deletion check every minute
  useEffect(() => {
    const intervalId = setInterval(deleteRejectedAppointments, 60000); // 60000 ms = 1 minute

    // Cleanup the interval when the component is unmounted
    return () => clearInterval(intervalId);
  }, [appointments]);

  return (
    <div className="container mx-auto p-6 max-w-screen-lg">
      <h1 className="text-3xl font-bold text-center mb-6">Your Appointment Requests</h1>

      {/* Loading and error messages */}
      {loading && <p className="text-gray-600 text-center">Loading...</p>}
      {error && <p className="text-red-500 text-center">{error}</p>}

      {/* Display the appointments */}
      <div className="mt-6 overflow-x-auto">
        {appointments.length === 0 ? (
          <p className="text-center text-lg text-gray-500">No appointment requests found.</p>
        ) : (
          <table className="min-w-full bg-white border border-gray-200 shadow-lg rounded-lg">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-4 text-left font-semibold text-gray-700 border-b">Appointment Name</th>
                <th className="p-4 text-left font-semibold text-gray-700 border-b">Date</th>
                <th className="p-4 text-left font-semibold text-gray-700 border-b">Time Range</th>
                <th className="p-4 text-left font-semibold text-gray-700 border-b">Reason</th>
                <th className="p-4 text-left font-semibold text-gray-700 border-b">Status</th>
                <th className="p-4 text-left font-semibold text-gray-700 border-b">Action</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => (
                <tr key={appointment._id} className="border-b hover:bg-gray-50">
                  <td className="p-4">{appointment.appointmentName}</td>
                  <td className="p-4">{new Date(appointment.date).toLocaleDateString()}</td>
                  <td className="p-4">{appointment.timeRange?.startTime} - {appointment.timeRange?.endTime}</td>
                  <td className="p-4">{appointment.reason}</td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-white ${
                        appointment.status === 'pending'
                          ? 'bg-yellow-500'
                          : appointment.status === 'approved'
                          ? 'bg-green-500'
                          : 'bg-red-500'
                      }`}
                    >
                      {appointment.status}
                    </span>
                  </td>
                  <td className="p-4">
                    {appointment.status === 'pending' && (
                      <button
                        className="text-white bg-red-500 px-4 py-2 rounded-full hover:bg-red-700"
                        onClick={() => confirmDelete(appointment._id)}
                      >
                        Cancel
                      </button>
                    )}
                    {appointment.status === 'rejected' && (
                      <span className="text-gray-500">Rejected</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-auto">
            <h2 className="text-xl font-semibold text-center mb-4">Confirm Cancellation</h2>
            <p className="text-center mb-4">Are you sure you want to cancel this appointment?</p>
            <div className="flex justify-around">
              <button
                className="bg-red-500 text-white px-6 py-2 rounded-full hover:bg-red-700"
                onClick={handleDelete}
              >
                Yes, Cancel
              </button>
              <button
                className="bg-gray-500 text-white px-6 py-2 rounded-full hover:bg-gray-700"
                onClick={handleCloseModal}
              >
                No, Keep
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAppointments;
