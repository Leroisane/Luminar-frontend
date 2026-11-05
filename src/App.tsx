import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Dashboard from "./pages/Dashboard";
import AdminApprovalPage from "./pages/AdminApprovalPage";

function App() {
  return (
    <Router>
      <Routes>
        {/* Halaman Mahasiswa */}
        <Route path="/" element={<Dashboard />} />

        {/* Halaman Admin */}
        <Route path="/admin" element={<AdminApprovalPage />} />
      </Routes>
    </Router>
  );
}

export default App;