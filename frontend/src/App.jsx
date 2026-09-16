import { Routes, Route, useLocation } from "react-router-dom";
import NavBar from "./components/NavBar";
import Home from "./pages/Home";
import Verify from "./pages/Verify";
import MyTicket from "./pages/MyTicket";
import Scan from "./pages/Scan";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

export default function App() {
  const { pathname } = useLocation();
  const hideNav = pathname.startsWith("/admin/dashboard");

  return (
    <>
      {!hideNav && <NavBar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/my-ticket" element={<MyTicket />} />
        <Route path="/scan" element={<Scan />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </>
  );
}
