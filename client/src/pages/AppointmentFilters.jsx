// src/components/AppointmentFilters.jsx
const AppointmentFilters = ({ setDateFilter }) => {
    return (
      <div className="mb-4">
        <input
          type="date"
          onChange={(e) => setDateFilter(e.target.value)}
          className="p-2 border rounded"
        />
      </div>
    );
  };
  
  export default AppointmentFilters;  // Ensure you're exporting it as default
  