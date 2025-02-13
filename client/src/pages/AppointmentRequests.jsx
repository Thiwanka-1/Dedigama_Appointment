import React, { useEffect, useState } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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
        const response = await axios.get('https://dedigama-appointment.vercel.app//api/appointments/requests');
        setAppointments(response.data);
      } catch (error) {
        console.error("Error fetching appointment requests", error);
      }
    };
    fetchAppointments();
  }, []);

  // Handle appointment approval or rejection
  const handleStatusChange = async (id, status) => {
    try {
      const response = await axios.put(`https://dedigama-appointment.vercel.app//api/appointments/request/${id}/status`, { status });
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
      head: [['Requester Name', 'Date', 'Time Range', 'Reason', 'Status']],
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
      {/* Generate Report Button */}
      <div className="flex justify-between items-center mb-6">
        <button 
          className="bg-blue-600 text-white px-6 py-2 rounded-md shadow-md hover:bg-blue-700 transition-all duration-200" 
          onClick={generateReport}
        >
          Generate PDF Report
        </button>
        <h1 className="text-4xl font-semibold text-center">Appointment Requests</h1>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow-lg">
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
