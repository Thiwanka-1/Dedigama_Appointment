import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import AppointmentFilters from './AppointmentFilters';
import { jsPDF } from 'jspdf';

const ViewAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [dateFilter, setDateFilter] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const navigate = useNavigate();

  // Fetch all appointments from the server
  const fetchAppointments = async () => {
    try {
      const response = await axios.get('https://dedigama-appointment.vercel.app/api/appointments/get');
      const sortedAppointments = response.data.sort((a, b) => a.appointmentNumber - b.appointmentNumber);
      setAppointments(sortedAppointments);
      setFilteredAppointments(sortedAppointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  };

  // Call fetchAppointments when the component mounts
  useEffect(() => {
    fetchAppointments();
  }, []);

  // Filter appointments based on the selected date
  useEffect(() => {
    if (dateFilter) {
      setFilteredAppointments(
        appointments.filter((appointment) => appointment.date.startsWith(dateFilter))
      );
    } else {
      setFilteredAppointments(appointments);
    }
  }, [dateFilter, appointments]);

  // Update the current time every second
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(new Date().toLocaleString());
    }, 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Get appointments for today's date
  const getTodayAppointments = () => {
    const today = new Date().toISOString().split('T')[0];
    return appointments.filter((appointment) => appointment.date.startsWith(today));
  };

  // Handle appointment deletion
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this appointment?');
    if (confirmDelete) {
      try {
        await axios.delete(`https://dedigama-appointment.vercel.app/api/appointments/delete/${id}`);
        setAppointments(appointments.filter((appointment) => appointment._id !== id));
        setFilteredAppointments(filteredAppointments.filter((appointment) => appointment._id !== id));
      } catch (error) {
        console.error("Error deleting appointment:", error);
      }
    }
  };

  // Navigate to update page with the appointment ID
  const handleUpdate = (appointment) => {
    navigate(`/appointment-update/${appointment._id}`);
  };

  // Format date in MM/DD/YYYY format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Generate PDF for today's appointments
  const generateReport = () => {
    const doc = new jsPDF();
    const todayAppointments = getTodayAppointments();
    const currentDate = new Date().toLocaleDateString();

    doc.setFontSize(18);
    doc.text('Appointments Report', 14, 22);
    doc.setFontSize(12);
    doc.text(`Date: ${currentDate}`, 14, 30);

    const tableHeaders = ["Appointment Number", "Appointment Name", "Date", "Time Range", "With Whom", "Reason"];
    const tableData = todayAppointments.map(appointment => {
      const timeRange = `${appointment.timeRange.startTime} - ${appointment.timeRange.endTime}`; // Concatenate start and end time
      return [
        appointment.appointmentNumber,
        appointment.appointmentName,
        formatDate(appointment.date),
        timeRange, // Use the concatenated time range
        appointment.withWhom,
        appointment.reason,
      ];
    });

    doc.autoTable({
      startY: 35,
      head: [tableHeaders],
      body: tableData,
      margin: { top: 10, left: 14, right: 14 },
      styles: { fontSize: 10 },
      theme: 'striped',
    });

    doc.save('appointments_report.pdf');
};


  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="absolute right-6 text-xl font-semibold text-gray-800">
          <div>{currentTime}</div>
        </div>

        <h2 className="text-3xl font-semibold text-center text-gray-800 mb-6">Appointments List</h2>

        <AppointmentFilters setDateFilter={setDateFilter} />
        
        <div className="mb-4">
          <button
            onClick={generateReport}
            className="bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600 transition-colors"
          >
            Generate Today's Report (PDF)
          </button>
        </div>

        <div className="overflow-x-auto shadow-xl sm:rounded-lg mt-6">
          <table className="min-w-full table-auto bg-white rounded-lg shadow-lg">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="px-3 py-3 text-left text-sm font-medium">Appointment Number</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Appointment Name</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Date</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Time Range</th>
                <th className="px-6 py-3 text-left text-sm font-medium">With Whom</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Reason</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.map((appointment) => (
                <tr key={appointment._id} className="border-b hover:bg-blue-50 transition-colors">
                  <td className="px-20 py-4 text-sm font-medium">{appointment.appointmentNumber}</td>
                  <td className="px-6 py-4 text-sm">{appointment.appointmentName}</td>
                  <td className="px-6 py-4 text-sm">{formatDate(appointment.date)}</td>
                  <td className="px-6 py-4 text-sm">
                      {appointment.timeRange ? `${appointment.timeRange.startTime} - ${appointment.timeRange.endTime}` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm">{appointment.withWhom}</td>
                  <td className="px-6 py-4 text-sm">{appointment.reason}</td>
                  
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ViewAppointments;
