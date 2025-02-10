import { BrowserRouter, Routes, Route} from 'react-router-dom';
import Home from './pages/Home';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Profile from './pages/Profile';
import Header from './components/Header';
import PrivateRoute from './components/PrivateRoute';

import AdminProfile from './pages/AdminProfile';
import ManageUsers from './pages/ManageUsers';
import AppointmentsList from './pages/AppointmentsList';
import AppointmentForm from './pages/AppointmentFrom';
import AppointmentDetails from './pages/AppointmentDetails';
import AppointmentUpdate from './pages/AppointmentUpdate';
import ViewAppointments from './pages/ViewAppointments';
import AvailableSlotsPage from './pages/AvailableSlotsPage';
import AppointmentRequestPage from './pages/AppointmentRequestPage';
import UserAppointments from './pages/UserAppointments';
import AppointmentRequests from './pages/AppointmentRequests';




export default function App() {
  return <BrowserRouter>
  <Header />
    <Routes>
      <Route path = "/" element = {<Home />} />
      <Route path = "/sign-in" element = {<SignIn />} />
      <Route path = "/sign-up" element = {<SignUp />} />

      <Route element={<PrivateRoute />}>
        <Route path = "/profile" element = {<Profile />} />

        <Route path="/appointments" element={<AppointmentsList />} />
        <Route path="/appointments/new" element={<AppointmentForm />} />
        <Route path="/appointments/:id" element={<AppointmentDetails />} />
        <Route path="/appointment-update/:id" element={<AppointmentUpdate />} />
        <Route path="/view" element={<ViewAppointments />} />
        
        <Route path="/user-req" element={<UserAppointments/>} />
        <Route path="/slots" element={<AvailableSlotsPage />} />
        <Route path="/appointment-request" element={<AppointmentRequestPage />} />
        <Route path="/req" element={<AppointmentRequests />} />

      </Route>

      <Route element={<PrivateRoute adminOnly={true} />}>
        <Route path="/manage-users" element={<ManageUsers />} />
        <Route path='/admin-profile' element={<AdminProfile />} />

      </Route>
    </Routes>
  
  </BrowserRouter>
    
}
