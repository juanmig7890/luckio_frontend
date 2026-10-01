import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Lobby from './pages/Lobby';
import Profile from './pages/Profile';
import ComingSoon from './pages/ComingSoon';
import Slots from './pages/Slots';
import Roulette from './pages/Roulette';
import Blackjack from './pages/Blackjack';
import Sports from './pages/Sports';

function Splash() {
  return <div className="splash"><div className="logo logo-big">LUCK<span>.IO</span></div></div>;
}

function PrivateRoute() {
  const { user, loading } = useAuth();
  if (loading) return <Splash />;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

function PublicRoute() {
  const { user, loading } = useAuth();
  if (loading) return <Splash />;
  return user ? <Navigate to="/" replace /> : <Outlet />;
}

function Layout() {
  return (
    <>
      <Navbar />
      <main className="container">
        <Outlet />
      </main>
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route element={<PrivateRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Lobby />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/game/slots" element={<Slots />} />
          <Route path="/game/roulette" element={<Roulette />} />
          <Route path="/game/blackjack" element={<Blackjack />} />
          <Route path="/game/sports" element={<Sports />} />
          <Route path="/game/:id" element={<ComingSoon />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}