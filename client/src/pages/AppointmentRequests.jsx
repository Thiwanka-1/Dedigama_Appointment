import React, { useEffect, useState } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Format the date in YYYY-M-D format without leading zeroes for month/day.
 */
const formatDate = (date) => {
  const newDate = new Date(date);
  const day = newDate.getDate();
  const month = newDate.getMonth() + 1; // zero-indexed
  const year = newDate.getFullYear();
  return `${year}-${month}-${day}`;
};

const AppointmentRequests = () => {
  const [appointments, setAppointments] = useState([]);
  const [loadingStatus, setLoadingStatus] = useState({}); // track loading state per request
  const [globalError, setGlobalError] = useState('');     // display any global error

  // 1) Fetch all appointment requests on component mount
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await axios.get('/api/appointments/requests');
        // Sort the appointments by date (oldest first)
        const sortedAppointments = response.data.sort(
          (a, b) => new Date(a.date) - new Date(b.date)
        );
        setAppointments(sortedAppointments);
      } catch (error) {
        console.error("Error fetching appointment requests", error);
        setGlobalError("Error fetching appointment requests. Please try again later.");
      }
    };
    fetchAppointments();
  }, []);

  // 2) Delete old requests
  const handleDeleteOldRequests = async () => {
    try {
      const response = await axios.delete('/api/appointments/delete-old-requests');
      alert(response.data.message);
      // Remove old requests from state
      setAppointments(prev =>
        prev.filter(request => new Date(request.date) >= new Date())
      );
    } catch (error) {
      console.error("Error deleting old appointment requests", error);
      alert("Failed to delete old appointment requests.");
    }
  };

  // 3) Approve or reject an appointment
  const handleStatusChange = async (id, status) => {
    setGlobalError('');
    setLoadingStatus(prev => ({ ...prev, [id]: true })); // show loading for this request

    try {
      const response = await axios.put(`/api/appointments/request/${id}/status`, { status });
      // On success
      alert(response.data.message);

      // Update the request in state
      const updatedRequest = response.data.appointmentRequest;
      setAppointments(prev =>
        prev.map(appt => appt._id === id ? { ...appt, status: updatedRequest.status } : appt)
      );
    } catch (error) {
      console.error("Error updating appointment status:", error);

      const errMsg = error.response?.data?.message ||
                     "Error updating appointment status. Please try again.";
      alert(errMsg);
      setGlobalError(errMsg);

      // If the backend automatically rejected due to overlap, update UI
      if (errMsg.toLowerCase().includes('automatically rejected')) {
        setAppointments(prev =>
          prev.map(appt => appt._id === id ? { ...appt, status: 'rejected' } : appt)
        );
      }
    } finally {
      setLoadingStatus(prev => ({ ...prev, [id]: false })); // stop loading
    }
  };

  // 4) Generate PDF report
  const generateReport = () => {
    const doc = new jsPDF();
    doc.text('Appointment Requests Report', 14, 10);
    doc.autoTable({
      startY: 20,
      head: [['Requester Name', 'Date', 'Time Range', 'Reason', 'Phone', 'Status']],
      body: appointments.map(req => [
        req.withWhom,
        formatDate(req.date),
        `${req.timeRange.startTime} - ${req.timeRange.endTime}`,
        req.reason,
        req.phoneNum,
        req.status
      ]),
    });
    doc.save('appointment_requests_report.pdf');
  };

  return (
    <div className="container mx-auto mt-8">
      {/* Title */}
      <div className="flex justify-center items-center mb-6">
        <h2 className="text-3xl font-semibold text-gray-800">Appointments Requests</h2>
      </div>

      {/* Global error */}
      {globalError && (
        <div className="mb-4 text-center text-red-600">
          {globalError}
        </div>
      )}

      {/* Delete Old Requests & Generate PDF Report Buttons */}
      <div className="mb-4 flex justify-between">
        <button
          onClick={handleDeleteOldRequests}
          className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
        >
          Delete Old Requests
        </button>

        <button
          onClick={generateReport}
          className="bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600 transition-colors"
        >
          Generate PDF Report
        </button>
      </div>

      {/* Table of Appointment Requests */}
      <div className="overflow-x-auto bg-white rounded-lg shadow-lg mb-8">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="px-6 py-3 border-b">Requester Name</th>
              <th className="px-6 py-3 border-b">Date</th>
              <th className="px-6 py-3 border-b">Time Range</th>
              <th className="px-6 py-3 border-b">Reason</th>
              <th className="px-6 py-3 border-b">Phone</th>
              <th className="px-6 py-3 border-b">Status</th>
              <th className="px-6 py-3 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.length > 0 ? (
              appointments.map(appointment => (
                <tr key={appointment._id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4">{appointment.withWhom}</td>
                  <td className="px-6 py-4">{formatDate(appointment.date)}</td>
                  <td className="px-6 py-4">
                    {appointment.timeRange.startTime} - {appointment.timeRange.endTime}
                  </td>
                  <td className="px-6 py-4">{appointment.reason}</td>
                  <td className="px-6 py-4">{appointment.phoneNum}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-white ${
                        appointment.status === 'approved'
                          ? 'bg-green-500'
                          : appointment.status === 'rejected'
                          ? 'bg-red-500'
                          : 'bg-yellow-500'
                      }`}
                    >
                      {appointment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                    {appointment.status === 'pending' && (
                      <>
                        <button
                          disabled={loadingStatus[appointment._id]}
                          className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-all duration-200"
                          onClick={() => handleStatusChange(appointment._id, 'approved')}
                        >
                          {loadingStatus[appointment._id] ? 'Loading...' : 'Approve'}
                        </button>
                        <button
                          disabled={loadingStatus[appointment._id]}
                          className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-all duration-200"
                          onClick={() => handleStatusChange(appointment._id, 'rejected')}
                        >
                          {loadingStatus[appointment._id] ? 'Loading...' : 'Reject'}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center py-4">
                  No appointment requests found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AppointmentRequests;
