import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AvailableSlotsPage = () => {
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [date, setDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  // Fetch available slots when the date is selected
  const fetchAvailableSlots = async (selectedDate) => {
    if (!selectedDate) return; // No date selected

    setIsLoading(true); // Show loading state
    setSelectedSlot(null); // Clear any previously selected slot
    setErrorMessage(''); // Reset any previous error message

    try {
      const response = await axios.get(`/api/appointments/check-availability?date=${selectedDate}`);
      if (response.data.success && response.data.availableSlots.length > 0) {
        setAvailableSlots(response.data.availableSlots);
      } else {
        setErrorMessage('No available slots for the selected date.');
        setAvailableSlots([]);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching available slots:', error.response ? error.response.data : error.message);
      setErrorMessage('Error fetching available slots, please try again.');
      setIsLoading(false);
    }
  };

  // Trigger the slot fetch when date changes
  useEffect(() => {
    if (date) {
      fetchAvailableSlots(date);
    } else {
      setAvailableSlots([]);
    }
  }, [date]);

  // Handle slot selection
  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot); // Set the selected slot state
  };

  // Handle slot request
  const handleRequestAppointment = () => {
    if (selectedSlot) {
      navigate(`/appointment-request?date=${date}&startTime=${selectedSlot.startTime}&endTime=${selectedSlot.endTime}`);
    }
  };

  // Get the current date in YYYY-MM-DD format
  const currentDate = new Date().toISOString().split('T')[0];

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full sm:w-96 md:w-1/2 lg:w-1/3 xl:w-1/4">
        <h1 className="text-3xl font-bold text-center text-blue-600 mb-8">Select Available Time</h1>

        {/* Date selection */}
        <div className="mb-6">
          <label htmlFor="date" className="block text-sm font-medium text-gray-700">Select a Date</label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={currentDate} // Set the minimum date to the current date
            className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mb-4 text-center text-red-600 mt-4">
            <p>{errorMessage}</p>
          </div>
        )}

        {/* Available slots rendering */}
        {isLoading && <p className="text-center text-blue-500">Loading available slots...</p>}

        {availableSlots.length > 0 && !isLoading && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold text-center text-gray-800 mb-4">Available Time Slots</h2>
            {availableSlots.map((slot, index) => (
              <button
                key={index}
                onClick={() => handleSlotSelect(slot)}
                className={`block w-full text-left py-3 px-4 rounded-md mb-4 text-lg ${selectedSlot && selectedSlot.startTime === slot.startTime ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'} hover:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                {slot.startTime} - {slot.endTime}
              </button>
            ))}
          </div>
        )}

        {/* Proceed button */}
        <button
          onClick={handleRequestAppointment}
          className={`w-full py-3 px-4 rounded-md text-white text-lg ${selectedSlot ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'}`}
          disabled={!selectedSlot}
        >
          Proceed to Request
        </button>
      </div>
    </div>
  );
};

export default AvailableSlotsPage;
