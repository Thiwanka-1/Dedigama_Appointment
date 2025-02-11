// HomePage.js
import React from 'react';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-3xl w-full bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-4">Welcome to the Appointment Management System</h1>
        <p className="text-lg text-center text-gray-600 mb-6">
          Manage your appointments efficiently and effortlessly. Stay organized with our intuitive system.
        </p>

        <div className="text-center">
          <a 
            href="/appointments" 
            className="inline-block bg-blue-600 text-white text-xl font-semibold py-3 px-6 rounded-md shadow-md hover:bg-blue-700 transition duration-300"
          >
            View Appointments
          </a>
        </div>

        <div className="mt-6 border-t pt-6 text-center">
          <p className="text-sm text-gray-500">Built with React and Tailwind CSS</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
