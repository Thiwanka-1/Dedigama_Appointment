import React, { useEffect, useState } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import moment from 'moment-timezone'; // Import moment-timezone

// Function to format the date without leading zeroes
const formatDate = (date) => {
  const newDate = new Date(date);
  const day = newDate.getDate();
  const month = newDate.getMonth() + 1; // Months are zero-indexed
  const year = newDate.getFullYear();
  return `${year}-${month}-${day}`;
};

const AppointmentRequests = () => {
  const [appointments, setAppointments] = useState([]);

  // Fetch the appointment requests from the backend
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await axios.get('/api/appointments/requests');
        setAppointments(response.data);
      } catch (error) {
        console.error("Error fetching appointment requests", error);
      }
    };
    fetchAppointments();
  }, []);

  // Function to handle deletion of old appointment requests
  const handleDeleteOldRequests = async () => {
    try {
      const response = await axios.delete('/api/appointments/delete-old-requests');
      alert(response.data.message); // Show success message
      setAppointments(appointments.filter(request => new Date(request.date) >= new Date())); // Remove deleted requests from state
    } catch (error) {
      console.error("Error deleting old appointment requests", error);
      alert("Failed to delete old appointment requests.");
    }
  };

  // Handle appointment approval or rejection
  const handleStatusChange = async (id, status) => {
    if (status !== "approved") {
      try {
        const response = await axios.put(`/api/appointments/request/${id}/status`, { status });
        alert(response.data.message);
        setAppointments(appointments.map(appointment =>
          appointment._id === id ? { ...appointment, status: status } : appointment
        ));
      } catch (error) {
        console.error("Error updating appointment status", error);
      }
      return;
    }
  
    try {
      const { data: existingAppointments } = await axios.get("/api/appointments/get");
      const approvingAppointment = appointments.find(appt => appt._id === id);
      if (!approvingAppointment) {
        alert("Appointment not found.");
        return;
      }

      const approvingStart = moment(`${approvingAppointment.date} ${approvingAppointment.timeRange.startTime}`, "YYYY-MM-DD HH:mm");
      const approvingEnd = moment(`${approvingAppointment.date} ${approvingAppointment.timeRange.endTime}`, "YYYY-MM-DD HH:mm");

      const hasOverlap = existingAppointments.some(appt => {
        if (appt.status !== "approved" || appt._id === id) return false;

        const existingStart = moment(`${appt.date} ${appt.timeRange.startTime}`, "YYYY-MM-DD HH:mm");
        const existingEnd = moment(`${appt.date} ${appt.timeRange.endTime}`, "YYYY-MM-DD HH:mm");

        return approvingStart.isBefore(existingEnd) && approvingEnd.isAfter(existingStart);
      });

      if (hasOverlap) {
        alert("This appointment overlaps with an existing approved appointment. Please choose another time.");
        return;
      }

      const response = await axios.put(`/api/appointments/request/${id}/status`, { status });
      alert(response.data.message);

      setAppointments(appointments.map(appointment =>
        appointment._id === id ? { ...appointment, status: status } : appointment
      ));
    } catch (error) {
      console.error("Error updating appointment status", error);
    }
  };

  // Generate a PDF report of the appointment requests
  const generateReport = () => {
    const doc = new jsPDF();
    doc.text('Appointment Requests Report', 14, 10);
    doc.autoTable({
      startY: 20,
      head: [['Requester Name', 'Date', 'Time Range', 'Reason','Phone', 'Status']],
      body: appointments.map(req => [
        req.withWhom, 
        formatDate(req.date), // Use the custom date formatting
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

      {/* Delete Old Requests Button */}
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

      {/* Table */}
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
              appointments.map((appointment) => (
                <tr key={appointment._id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4">{appointment.withWhom}</td>
                  <td className="px-6 py-4">{formatDate(appointment.date)}</td>
                  <td className="px-6 py-4">{appointment.timeRange.startTime} - {appointment.timeRange.endTime}</td>
                  <td className="px-6 py-4">{appointment.reason}</td>
                  <td className="px-6 py-4">{appointment.phoneNum}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-white ${appointment.status === 'approved' ? 'bg-green-500' : appointment.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'}`}>
                      {appointment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                    {appointment.status === 'pending' && (
                      <>
                        <button 
                          className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-all duration-200"
                          onClick={() => handleStatusChange(appointment._id, 'approved')}
                        >
                          Approve
                        </button>
                        <button 
                          className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-all duration-200"
                          onClick={() => handleStatusChange(appointment._id, 'rejected')}
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center py-4">No appointment requests found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AppointmentRequests;
