import { Navigate, Routes, Route } from 'react-router-dom';

import HomePage from '../pages/Home/HomePage';
import LoginPage from '../pages/Auth/LoginPage';
import SignupPage from '../pages/Auth/SignupPage';
import CompleteProfilePage from '../pages/Auth/CompleteProfilePage';
import DashboardPage from '../pages/Dashboard/DashboardPage';
import CreateRoomPage from '../pages/Rooms/CreateRoomPage';
import JoinByInvitePage from '../pages/Join/JoinByInvitePage';
import RoomPage from '../pages/Room/RoomPage';
import NotFoundPage from '../pages/NotFound/NotFoundPage';
import ProtectedRoute from './ProtectedRoute';

const AppRouter = () => {
  return (
    <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/complete-profile"
          element={
            <ProtectedRoute>
              <CompleteProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Navigate to="/rooms" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rooms"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rooms/new"
          element={
            <ProtectedRoute>
              <CreateRoomPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/join"
          element={
            <ProtectedRoute>
              <JoinByInvitePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/join/:inviteCode"
          element={
            <ProtectedRoute>
              <JoinByInvitePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rooms/:roomId"
          element={
            <ProtectedRoute>
              <RoomPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRouter;

