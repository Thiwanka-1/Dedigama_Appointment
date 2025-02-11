import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const AppointmentRequestPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract query params from the URL
  const queryParams = new URLSearchParams(location.search);
  const date = queryParams.get('date');
  const startTimeFromUrl = queryParams.get('startTime');
  const endTimeFromUrl = queryParams.get('endTime');

  // State management
  const [appointmentName, setAppointmentName] = useState('');
  const [selectedStartTime, setSelectedStartTime] = useState(startTimeFromUrl || '');
  const [selectedEndTime, setSelectedEndTime] = useState(endTimeFromUrl || '');
  const [reason, setReason] = useState('');
  const [requestedBy, setRequestedBy] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);

  // User authentication: Retrieve token from localStorage for authentication
  const token = localStorage.getItem('access_token'); 

  // User authentication: Replace this with actual method to get userId
  const userId = localStorage.getItem('userId') || 'someUserId'; 

  const reasonOptions = [
    'Visitors', 'Head Office Interview', 'Branch Interview', 'Manager Interview',
    'Head Office Staff', 'Staff Meeting', 'Manager Meeting', 'Urgent Meeting',
    'Gem Meeting', 'Document Signing', 'Gem Validation', 'Hotel Meeting',
    'Audit Meeting', 'IT Meeting', 'Procurement Meeting', 'Jewelry Meeting',
    'Property Meeting', 'Finance Meeting', 'RM Meeting', 'ARM Meeting'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('User ID before submitting:', userId);  // Log to check the userId value

    const appointmentData = {
      appointmentName,
      date,
      timeRange: {
        startTime: selectedStartTime,
        endTime: selectedEndTime,
      },
      reason,
      withWhom: requestedBy,
      userId,  // Add userId to the request
    };

    console.log(appointmentData); // Debugging purpose

    try {
      const response = await axios.post('http://localhost:3000/api/appointments/request', appointmentData);
      
      if (response.status === 201 && response.data.success) {
        setMessage({ text: 'Appointment request submitted successfully!', type: 'success' });
        setIsModalOpen(true);
      } else {
        setMessage({ text: 'Something went wrong. Please try again later.', type: 'error' });
      }
    } catch (error) {
      console.error('Error submitting appointment request:', error.response.data);  // Log detailed error
      setMessage({ text: 'Error occurred during submission. Please try again later.', type: 'error' });
    }
    
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleConfirmRedirect = () => {
    // Redirect to the availability checking page
    navigate('/slots');
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full sm:w-96 md:w-1/2 lg:w-1/3 xl:w-1/4">
        <h1 className="text-3xl font-bold text-center text-blue-600 mb-8">Appointment Request</h1>

        {message.text && (
          <div className={`mb-6 text-center ${message.type === 'success' ? 'text-green-600' : 'text-red-600'} font-semibold`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="appointmentName" className="block text-sm font-medium text-gray-700">Appointment Name</label>
            <input
              type="text"
              id="appointmentName"
              value={appointmentName}
              onChange={(e) => setAppointmentName(e.target.value)}
              required
              className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="text"
              id="date"
              value={date}
              readOnly
              className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700">Select Time Range</label>
            <div className="flex gap-4">
              <input
                type="time"
                id="startTime"
                value={selectedStartTime}
                onChange={(e) => setSelectedStartTime(e.target.value)}
                min={startTimeFromUrl || '00:00'}
                max={selectedEndTime || '23:59'}
                required
                className="mt-2 w-1/2 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="time"
                id="endTime"
                value={selectedEndTime}
                onChange={(e) => setSelectedEndTime(e.target.value)}
                min={selectedStartTime || '00:00'}
                max={endTimeFromUrl || '23:59'}
                required
                className="mt-2 w-1/2 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700">Reason</label>
            <select
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Reason</option>
              {reasonOptions.map((reasonOption, index) => (
                <option key={index} value={reasonOption}>{reasonOption}</option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label htmlFor="requestedBy" className="block text-sm font-medium text-gray-700">Requested By</label>
            <input
              type="text"
              id="requestedBy"
              value={requestedBy}
              onChange={(e) => setRequestedBy(e.target.value)}
              required
              className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Submit Request
          </button>
        </form>
      </div>

      {/* Success Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-96">
            <h2 className="text-2xl font-bold text-green-600">Success!</h2>
            <p className="mt-4 text-gray-700">Your appointment request has been submitted successfully.</p>
            <p className="mt-2 text-gray-600"><strong>Appointment Details:</strong></p>
            <div className="mt-2 text-gray-600">
              <p><strong>Name:</strong> {appointmentName}</p>
              <p><strong>Date:</strong> {date}</p>
              <p><strong>Time:</strong> {selectedStartTime} - {selectedEndTime}</p>
              <p><strong>Reason:</strong> {reason}</p>
              <p><strong>Requested By:</strong> {requestedBy}</p>
            </div>
            <div className="mt-6 flex justify-center">
              <button 
                onClick={handleConfirmRedirect} 
                className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentRequestPage;
